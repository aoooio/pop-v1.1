const express = require("express");
const request = require("request");
const passport = require("passport");
const X2JS = require("x2js");
require("../passport")(passport);
const Thesaurus = require("../models/thesaurus");
const { capture } = require("../sentry.js");
const x2js = new X2JS();
const router = express.Router();

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

router.get("/search", passport.authenticate("jwt", { session: false }), (req, res) => {
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/search'
      #swagger.description = 'Retourne les informations de la notice Thesaurus en fonction des paramètres' 
  */
  let id = req.query.id;
  let value = escapeRegExp(req.query.value);
  let q = Thesaurus.find({ arc: id, value: { $regex: new RegExp("^" + value) } }).limit(10);
  q.exec((e, values) => {
    res.send(values);
  });
});

router.get("/autocompleteThesaurus", passport.authenticate("jwt", { session: false }), (req, res) => {
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/autocompleteThesaurus'
      #swagger.description = 'Retourne les thésaurus en fonction de son identifiant et correspondant à la valeur (autocompletion)' 
  */
  let id = req.query.id;
  let value = escapeRegExp(req.query.value);
  let q = Thesaurus.find({ idThesaurus: id, value: { $regex: new RegExp("^" + value) } });
  q.exec((e, values) => {
    values = values.map( element => {
      return {
        _id: element._id,
        idThesaurus: element.idThesaurus,
        arc: element.arc,
        label: element.value,
        isAltLabel: element.altLabel,
      }
    })
    res.send({ statusCode: 202, body: JSON.stringify(values) });
  });
});

router.get("/validate", passport.authenticate("jwt", { session: false }), (req, res) => {
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/validate'
      #swagger.description = 'Retourne les thésaurus en fonction de son identifiant et correspondant à la valeur' 
  */
  let id = req.query.id;
  let value = escapeRegExp(req.query.value);
  const query = {
    idThesaurus: id,
    $text: { $search: `${req.query.value}`, $caseSensitive: false, $diacriticSensitive: false }
  };

  Thesaurus.find(query, (e, values) => {
    values = values.map( element => {
      return {
        _id: element._id,
        idThesaurus: element.idThesaurus,
        arc: element.arc,
        label: element.value,
        isAltLabel: element.altLabel,
      }
    })
    res.send({ statusCode: 202, body: JSON.stringify(values) });
  });
});

router.get(
  "/getTopConceptsByThesaurusId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/getTopConceptsByThesaurusId'
      #swagger.description = 'Retourne les informations de la notice Thesaurus en fonction des paramètres' 
    */
    try {
      const thesaurusId = req.query.id;
      getTopConceptsByThesaurusId(thesaurusId).then(arr => {
        res.status(200).send(arr);
      });
    } catch (e) {
      capture(e);
      res.status(500).send({ success: false, msg: JSON.stringify(e) });
    }
  }
);

router.get(
  "/getAllChildrenConcept",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/getAllChildrenConcept'
      #swagger.description = 'Retourne les informations de la notice Thesaurus en fonction des paramètres' 
    */
    try {
      const topconcepts = req.query.id;
      const arr = [];
      getAllChildrenConcept(topconcepts, arr).then(() => {
        res.status(200).send(arr);
      });
    } catch (e) {
      capture(e);
      res.status(500).send({ success: false, msg: JSON.stringify(e) });
    }
  }
);

router.get(
  "/getPreferredTermByConceptId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/getPreferredTermByConceptId'
      #swagger.description = 'Retourne les informations de la notice Thesaurus en fonction des paramètres' 
    */
    try {
      const conceptId = req.query.id;
      const allTerms = [];
      getPreferredTermByConceptId(conceptId).then(r => {
        for (let j = 0; j < r.length; j++) {
          if (r[j].languageId === "fr-FR") {
            allTerms.push(r[j].lexicalValue);
          }
        }
        res.status(200).send(allTerms);
      });
    } catch (e) {
      capture(e);
      res.status(500).send({ success: false, msg: JSON.stringify(e) });
    }
  }
);

router.get("/deleteAllThesaurus", passport.authenticate("jwt", { session: false }), (req, res) => {
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/deleteAllThesaurus'
      #swagger.description = 'Suppression de tous les Thesaurus' 
  */
  try {
    const thesaurusId = req.query.id;
    Thesaurus.remove({ arc: thesaurusId }, function() {
      return res.status(200).send({ success: true, msg: "Tous les thésaurus ont été supprimés." });
    });
  } catch (e) {
    capture(e);
    res.status(500).send({ success: false, msg: JSON.stringify(e) });
  }
});

router.post("/createThesaurus", passport.authenticate("jwt", { session: false }), (req, res) => {
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/deleteAllThesaurus'
      #swagger.description = 'Création d'un Thesaurus' 
  */
  try {
    const thesaurusId = req.query.id;
    const terms = req.body.terms;
    // Create all existing terms.
    const arr = terms.map(e => new Thesaurus({ arc: thesaurusId, value: e }));
    Thesaurus.insertMany(arr, (err, docs) => {
      if (err) {
        capture(err);
      }
      res.status(200).send({ success: true, msg: "OK" });
    });
  } catch (e) {
    capture(e);
    res.status(500).send({ success: false, msg: JSON.stringify(e) });
  }
});


router.get("/getThesaurusById", /*passport.authenticate("jwt", { session: false }),*/ (req, res) => { 
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/getThesaurusById'
      #swagger.description = 'Retourne la liste des Thesaurus en fonction de l'identifiant' 
  */
  const thesaurusId = req.query.id;

  if(!thesaurusId){
    return res.status(400).send({ success: false, msg: `L'identifiant "${thesaurusId}" est invalide`});
  }

  return new Promise((resolve, reject) => {
    request.get({
      url: `https://opentheso.huma-num.fr/opentheso/api/all/theso?id=${thesaurusId}&format=jsonld`
    },
    (error, response) => {
      if (!error && response.statusCode === 200) {
        updateThesaurus(thesaurusId, response.body);
        resolve(response);
      } else {
        capture(error);
        reject(error);
      }
    }
  );
  })
  .then(resp => { 
    res.status(200).send(resp);
  })
  .catch(error => res.status(400).send({ success: false, msg: error}));
});

async function updateThesaurus(idThesaurus, respData){
  const data = respData;
 
  Thesaurus.deleteMany({ idThesaurus: idThesaurus }, function() {
    createThesaurus(idThesaurus, data)
  });
}

async function createThesaurus(idThesaurus, data){
  const promises = [];
  const parseData = JSON.parse(data);
  const propId = "@id";
  const propAltLabel = "http://www.w3.org/2004/02/skos/core#altLabel";
  const propPrefLabel = "http://www.w3.org/2004/02/skos/core#prefLabel";

  parseData.forEach( ( el, i ) => {
    if(parseData[i][propAltLabel]) {
      parseData[i][propAltLabel].forEach(element => {
        let theso = new Thesaurus({
          idThesaurus: idThesaurus,
          arc: parseData[i][propId],
          value: element["@value"],
          altLabel: true
        });
        promises.push(theso.save());
      });
    }
   
    parseData[i][propPrefLabel].forEach( (element) => {
      let theso = new Thesaurus({
        idThesaurus: idThesaurus,
        arc: parseData[i][propId],
        value: element["@value"],
        altLabel: false
      });
      promises.push(theso.save());
    });
  });

  await Promise.all(promises);
}

async function deleteThesaurusById(id){
  await Thesaurus.deleteMany({ idThesaurus: id});
}

router.get("/autocompleteByIdthesaurusAndValue", passport.authenticate("jwt", { session: false }), (req, res) => { 
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/autocompleteByIdthesaurusAndValue'
      #swagger.description = 'Recherche de l'autocomplétion de la valeur par rapport à l'identifiant du thesaurus dans le référentiel thesaurus' 
  */
  const thesaurusId = req.query.id;
  const value = req.query.value;

  /*return new Promise((resolve, reject) => {
    request.get({
      url: `https://opentheso.huma-num.fr/opentheso/api/autocomplete?theso=${thesaurusId}&value=${value}&format=full`
    },
    (error, response) => {
      if (!error && response.statusCode === 202) {
        resolve(response);
      } else {
        capture(error);
        reject(error);
      }
    }
  );
  })
  .then(resp => { 
    res.status(200).send(resp);
  })
  .catch(error => res.status(400).send({ success: false, msg: error}));
  */
  return new Promise((resolve, reject) => {
    request.get({
      url: `https://opentheso.huma-num.fr/opentheso/api/autocomplete?theso=${thesaurusId}&value=${value}&format=full`
    },
    (error, response) => {
      if (!error && response.statusCode === 202) {
        resolve(response);
      } else {
        capture(error);
        reject(error);
      }
    }
  );
  })
  .then(resp => { 
    res.status(200).send(resp);
  })
  .catch(error => res.status(400).send({ success: false, msg: error}));
});

router.get("/getAllThesaurusById", (req, res) => { 
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/autocompleteByIdthesaurusAndValue'
      #swagger.description = 'Recherche de l'autocomplétion de la valeur par rapport à l'identifiant du thesaurus dans le référentiel thesaurus' 
  */
  const thesaurusId = req.query.id;

  Thesaurus.find({ idThesaurus:  thesaurusId}, (e, values) => {
    values = values.map( element => {
      return {
        _id: element._id,
        idThesaurus: element.idThesaurus,
        arc: element.arc,
        label: element.value,
        isAltLabel: element.altLabel,
      }
    })
    res.send({ statusCode: 202, body: JSON.stringify(values) });
  });
});

router.get("/getPrefLabelByIdArk", passport.authenticate("jwt", { session: false }), (req, res) => { 
  /* 	
      #swagger.tags = ['Thesaurus']
      #swagger.path = '/thesaurus/getPrefLabelByIdArk'
      #swagger.description = 'Recherche le prefLabel par rapport à l'identifiant Ark' 
  */
  const arkId = req.query.id;

  return new Promise((resolve, reject) => {
    request.get(
      `https://opentheso.huma-num.fr/opentheso/api/preflabel.fr/${arkId}.json`,
      (error, response) => {
        if (!error && response.statusCode === 202) {
          resolve(response);
        } else {
          capture(error);
          reject(error);
        }
      }
    );
  })
  .then(resp => { 
    res.status(200).send(resp);
  })
  .catch(error => { res.status(400).send({ success: false, msg: error}) });
});

function getAllChildrenConcept(conceptId, arr) {
  try {
    return new Promise(async (resolve, reject) => {
      arr.push(conceptId);
      const childs = await getChildrenByConceptId(conceptId);
      const ArrP = [];
      if (childs) {
        for (let i = 0; i < childs.length; i++) {
          ArrP.push(getAllChildrenConcept(childs[i], arr));
        }
      }
      await Promise.all(ArrP);
      resolve();
    });
  } catch (e) {
    capture(e);
    resolve();
  }
}

function getChildrenByConceptId(conceptId) {
  const body = `<soap:getChildrenByConceptId> 
          <conceptId>${conceptId}</conceptId> 
         </soap:getChildrenByConceptId>`;
  return post(body, "thesaurusConcept");
}

function getPreferredTermByConceptId(conceptId) {
  const body = `<soap:getPreferredTermByConceptId> 
            <conceptId>${conceptId}</conceptId> 
        </soap:getPreferredTermByConceptId>`;
  return post(body, "thesaurusConcept");
}

function getTopConceptsByThesaurusId(thesaurusId) {
  const body = `<soap:getTopConceptsByThesaurusId> 
            <thesaurusId>${thesaurusId}</thesaurusId> 
        </soap:getTopConceptsByThesaurusId>`;
  return post(body, "thesaurusConcept");
}

function post(req, service) {
  let envelopedBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://soap.ginco.mcc.fr/"> 
    <soapenv:Header/> 
    <soapenv:Body>${req}</soapenv:Body> 
    </soapenv:Envelope>`;

  return new Promise((resolve, reject) => {
    request.post(
      {
        url: `https://ginco.culture.fr/ginco-webservices/services/${service}`,
        body: envelopedBody,
        headers: { "Content-Type": "text/xml;charset=UTF-8" }
      },
      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          try {
            const bodyjson = x2js.xml2js(body);
            const key = Object.keys(bodyjson.Envelope.Body)[0];
            const resp = bodyjson.Envelope.Body[key].return;
            if (resp && !Array.isArray(resp)) {
              resolve([resp]);
            } else {
              resolve(resp);
            }
          } catch (e) {
            reject(new Error("Response malformed"));
          }
        } else {
          capture(error);
          reject(error);
        }
      }
    );
  });
}

module.exports = router;
