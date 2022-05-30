const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const filenamify = require("filenamify");
const validator = require("validator");
const upload = multer({ dest: "uploads/" });
const Enluminures = require("../models/enluminures");
const NoticesOAI = require("../models/noticesOAI");
let moment = require('moment-timezone')
const { capture } = require("./../sentry.js");
const { uploadFile, deleteFile, formattedNow, checkESIndex, updateNotice, updateOaiNotice, getBaseCompletName, identifyProducteur } = require("./utils");
const { canUpdateEnluminures, canCreateEnluminures, canDeleteEnluminures } = require("./utils/authorization");
const { checkValidRef } = require("./utils/notice");

function transformBeforeCreate(notice) {
  notice.DMIS = formattedNow();
  notice.CONTIENT_IMAGE = notice.IMG ? "oui" : "non";
}

// Control properties document, flag each error.
async function withFlags(notice) {
  notice.POP_FLAGS = [];
  // Required properties.
  /*["REF", "DOMN"]
    .filter(prop => !notice[prop])
    .forEach(prop => notice.POP_FLAGS.push(`${prop}_EMPTY`));
  // REF must be 11 chars.
  if (notice.REF && notice.REF.length !== 11) {
    notice.POP_FLAGS.push("REF_LENGTH_11");
  }*/

  // LIENS must be valid URLs.
  const arr = notice.LIENS;
  if(arr){
    for(let i=0; i<arr.length; i++){
      if(arr[i] && !validator.isURL(arr[i])){
        notice.POP_FLAGS.push(`LIENS_INVALID_URL`);
      }
    }
  }

  // Reference not found RENV
  if (notice.RENV) {
    for (let i = 0; i < notice.RENV.length; i++) {
      if (!(await Enluminures.exists({ REF: notice.RENV[i] }))) {
        notice.POP_FLAGS.push("RENV_REF_NOT_FOUND");
      }
    }
  }
  // Reference not found REFC
  if (notice.REFC) {
    for (let i = 0; i < notice.REFC.length; i++) {
      if (!(await Enluminures.exists({ REF: notice.REFC[i] }))) {
        notice.POP_FLAGS.push("REFC_REF_NOT_FOUND");
      }
    }
  }
  // Reference not found REFDE
  if (notice.REFDE) {
    for (let i = 0; i < notice.REFDE.length; i++) {
      if (!(await Enluminures.exists({ REF: notice.REFDE[i] }))) {
        notice.POP_FLAGS.push("REFDE_REF_NOT_FOUND");
      }
    }
  }

  return notice;
}


function transformBeforeCreateAndUpdate(notice) {
  return new Promise(async (resolve, reject) => {
    try {
      if (notice.IMG !== undefined) {
        if (Array.isArray(notice.IMG)) {
          notice.CONTIENT_IMAGE = notice.IMG.length ? "oui" : "non";
        } else {
          notice.CONTIENT_IMAGE = notice.IMG ? "oui" : "non";
        }
      }

      notice.DMAJ = formattedNow();

     /* if (notice.MUSEO) {
        const museo = await Museo.findOne({ REF: notice.MUSEO });
        if (museo) {
          notice.REGION = museo.REGION || "";
          notice.DPT = museo.DPT || "";
          notice.VILLE_M = museo.VILLE_M || "";
          notice.NOMOFF = museo.NOMOFF || "";
          notice.CONTACT = museo.CONTACT_GENERIQUE || "";

          if (museo.POP_COORDONNEES && museo.POP_COORDONNEES.lat) {
            notice.POP_COORDONNEES = museo.POP_COORDONNEES;
            notice.POP_CONTIENT_GEOLOCALISATION = "oui";
          } else {
            notice.POP_CONTIENT_GEOLOCALISATION = "non";
          }
        }
      }*/
      notice = await withFlags(notice);
      resolve();
    } catch (e) {
      capture(e);
      reject(e);
    }
  });
}

router.get("/:ref", async (req, res) => {
  /* 	
    #swagger.tags = ['Enluminures']
    #swagger.path = '/enluminures/{ref}'
    #swagger.description = "Retourne les informations de la notice enluminure par rapport à la référence"
    #swagger.parameters['ref'] = { 
      in: 'path', 
      description: 'Référence de la notice enluminure',
      type: 'string' 
    }
    #swagger.responses[200] = { 
      schema: { 
        "$ref": '#/definitions/GetEnluminures'
      },
      description: 'Récupération des informations avec succés' 
    }
    #swagger.responses[404] = { 
      description: 'Document non trouvé',
      schema: {
        success: false,
        msg: "Document introuvable"
      } 
    }
  */

  const doc = await Enluminures.findOne({ REF: req.params.ref });
  if (doc) {
    return res.status(200).send(doc);
  }
  return res.status(404).send({ success: false, msg: "Document introuvable" });
});


// Update a notice by ref
router.put(
  "/:ref",
  passport.authenticate("jwt", { session: false }),
  upload.any(),
  async (req, res) => {
     /* 	
      #swagger.tags = ['Enluminures']
      #swagger.path = '/enluminures/{ref}'
      #swagger.description = 'Modification de la notice Enluminures' 
    */
    const ref = req.params.ref;
    const notice = JSON.parse(req.body.notice);
    try {
      const updateMode = req.body.updateMode;
      const user = req.user;
      const prevNotice = await Enluminures.findOne({ REF: ref });
      await determineProducteur(notice);
      if (!await canUpdateEnluminures(req.user, prevNotice, notice)) {
        return res.status(401).send({
          success: false,
          msg: "Autorisation nécessaire pour mettre à jour cette ressource."
        });
      }
      const promises = [];

      // Delete previous images if not present anymore (only if the actually is an IMG field).
      if (notice.IMG !== undefined) {
        for (let i = 0; i < prevNotice.IMG.length; i++) {
          if (!(notice.IMG || []).includes(prevNotice.IMG[i])) {
            // Security: no need to escape filename, it comes from database.
            if (prevNotice.IMG[i]) {
              promises.push(deleteFile(prevNotice.IMG[i], "joconde"));
            }
          }
        }
      }
      // Upload all files.
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i];
        const path = `enluminures/${filenamify(notice.REF)}/${filenamify(f.originalname)}`;
        promises.push(uploadFile(path, f));
      }

      // Mis en place pour corriger les notices qui ont été importées manuellement
      if(!notice.POP_IMPORT){
        notice.POP_IMPORT = [];
      }

      // Update IMPORT ID (this code is unclear…)
      if (notice.POP_IMPORT.length) {
        const id = notice.POP_IMPORT[0];
        delete notice.POP_IMPORT;
        notice.$push = { POP_IMPORT: mongoose.Types.ObjectId(id) };
      }

      const timeZone = 'Europe/Paris';
      //Ajout de l'historique de la notice
      var today = moment.tz(new Date(),timeZone).format('YYYY-MM-DD HH:mm');
      
      let HISTORIQUE = prevNotice.HISTORIQUE || [];
      const newHistorique = {nom: user.nom, prenom: user.prenom, email: user.email, date: today, updateMode: updateMode};

      HISTORIQUE.push(newHistorique);
      notice.HISTORIQUE = HISTORIQUE;
      // Prepare and update notice.
      await transformBeforeCreateAndUpdate(notice);
      const obj = new Enluminures(notice);
      let oaiObj = { DMAJ: notice.DMAJ }
      checkESIndex(obj);
      promises.push(updateNotice(Enluminures, ref, notice));
      promises.push(updateOaiNotice(NoticesOAI, ref, oaiObj));
      //Modification des liens entre bases
  //    await populateBaseFromJoconde(notice, notice.REFMEM, Memoire);
  //    await populateBaseFromJoconde(notice, notice.REFPAL, Palissy);
  //    await populateBaseFromJoconde(notice, notice.REFMER, Merimee);
      // Consume promises and send sucessful result.
      await Promise.all(promises);
      res.status(200).send({ success: true, msg: "Notice mise à jour." });
    } catch (e) {
      capture(e);
      res.status(500).send({ success: false, error: e });
    }
  }
);

function determineProducteur(notice) {
  return new Promise(async (resolve, reject) => {
    try {
      let noticeProducteur
      noticeProducteur = await identifyProducteur("enluminures", notice.REF, "", "");
      if(noticeProducteur){
        notice.PRODUCTEUR = noticeProducteur;
      }
      else {
        notice.PRODUCTEUR = "Enluminures";
      }
      resolve();
    } catch (e) {
      capture(e);
      reject(e);
    }
  });
}

module.exports = router;
