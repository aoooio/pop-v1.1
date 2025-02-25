import React from "react";
import { Container } from "reactstrap";
import Mapping from "../../services/mapping";
import Importer from "./importer";
import Memoire from "../../entities/Memoire";

import utils from "./utils";

export default class Import extends React.Component {
  render() {
    return (
      <Container className="import">
        <Importer
          collection="memoire"
          readme={readme}
          recipient="memoire"
          parseFiles={parseFiles}
          dropzoneText={
            <span>
              Glissez & déposez vos fichiers au format <b>mémoire</b> (extension <code>.ods</code>)
              et les images associées (au format <code>.jpg</code>) dans cette zone
            </span>
          }
        />
      </Container>
    );
  }
}

function parseFiles(files, encoding) {
  return new Promise((resolve, reject) => {
    const errors = [];

    var objectFile = files.find(file => file.name.includes(".ods"));
    if (!objectFile) {
      reject("Pas de fichiers .ods detecté");
      return;
    }

    const filesMap = {};
    for (var i = 0; i < files.length; i++) {
      filesMap[convertLongNameToShort(files[i].name)] = files[i];
    }

    utils.readODS(objectFile).then(data => {
      const notices = [];

      for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        if (!obj.REF) {
          reject(`La notice ligne ${i + 1} n'a pas de reference valide`);
          return;
        }

        const notice = new Memoire(obj);

        // If NOMSN does not exists, don't update IMG.
        if (obj.REFIMG !== undefined) {
          if (!obj.REFIMG) {
            // If REFIMG is empty, delete IMG
            notice.IMG = "";
          } else {
            let fileName = String(obj.REFIMG);
            fileName = convertLongNameToShort(fileName);
            let img = filesMap[fileName];
            if (img) {
              notice.IMG = `memoire/${notice.REF}/${fileName}`;
              notice._files.push(img);
            } else {
              notice._errors.push(`Impossible de trouver l'image "${fileName}"`);
            }
          }
        }
        notices.push(notice);
      }
      resolve({ importedNotices: notices, fileNames: [objectFile.name] });
    });
  });
}

function convertLongNameToShort(str) {
  return str;
  // I keep this comment because I may need to put it back later. Im not sure about it.
  // return str
  //   .substring(str.lastIndexOf("/") + 1)
  //   .replace(/_[a-zA-Z0-9]\./g, ".")
  //   .replace(/^.*[\\\/]/g, "")
  //   .replace(/[a-zA-Z0-9]*_/g, "")
  //   .toLowerCase();
}

function readme() {
  const generatedFields = Object.keys(Mapping.memoire).filter(e => {
    return Mapping.memoire[e].generated;
  });
  const requiredFields = Object.keys(Mapping.memoire).filter(e => {
    return Mapping.memoire[e].required;
  });
  const controlsFields = Object.keys(Mapping.memoire).filter(e => {
    return Mapping.memoire[e].validation;
  });

  return (
    <div>
      <h5>Service archives photos</h5>
      <div>
        Cet onglet permet d’alimenter la base Mémoire pour la partie Archives photographiques.{" "}
        <br /> <br />
        <h6>Formats d’import </h6>
        Les formats de données pris en charge sont les suivants&nbsp;: <br />
        <ul>
          <li>texte : .ods (Open Office Document SpeardSheet) </li>
          <li>illustration : jpg.</li>
        </ul>
        La taille maximale d’un import est de 300Mo (soit environ 3000 notices avec image, ou 1
        million de notices sans images). <br /> <br />
        <h6>Champs obligatoires et contrôles de vocabulaire </h6>
        Les champs suivants doivent obligatoirement être renseignés : <br />
        <br />
        <ul>
          {requiredFields.map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <br />
        <h6>Test de validation des champs : </h6>
        Les tests suivants sont effectués lors des imports : <br />
        <br />
        <ul>
          {controlsFields.map(e => (
            <li key={e}>
              {e} : {Mapping.memoire[e].validation}
            </li>
          ))}
        </ul>
        <br />
        <h5>Que voulez-vous faire ?</h5>
        <h6>Je veux créer une notice :</h6>
        j’importe la notice.
        <br />
        <br />
        <h6>Je veux mettre à jour tout ou partie d’une notice :</h6>
        j’importe les champs à mettre à jour avec leurs nouvelles valeurs et j’écrase l’ancienne
        notice.
        <br />
        <br />
        <h6>Je veux effacer une ou plusieurs valeurs d’une notice : </h6>
        j’importe un fichier comportant le ou les champs que je veux supprimer en les laissant
        vides.
        <br />
        <br />
        <h6>Je veux supprimer une notice :</h6>
        je contacte l’administrateur de la base.
        <br />
        <br />
        <h6>Je veux ajouter une image :</h6>
        1) A l'import, dans mon fichier, je renseigne la notice concernée en précisant le champ REF, ainsi que le champ : IMG ou REFIMG avec le .jpeg de l'illustration.<br />
        <br />
        2) Directement depuis une notice développée : je peux cliquer sur "Ajouter une nouvelle image" et télécharger une nouvelle image directement depuis mon ordinateur. La notice Mémoire reçoit alors dans son champ IMG le contenu .jpeg de l'image téléchargée.<br />
        Si le champ LBASE contient bien la REF Mérimée ou Palissy MH associée, alors l'image ainsi stockée dans IMG pourra également illustrer une notice MH associée.
        <br />
        <br />
        NB : à la création d'une notice, POP génère automatiquement certains champs utiles au traitement des données. Il s'agit des champs : <br />
        <br />
        <ul>
          {generatedFields.map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <br />
        Aucun besoin de les renseigner lors d'un import.
        <br />
        <br />
        <a
          href="https://github.com/betagouv/pop/tree/master/apps/api/doc/memoire.md"
          target="_blank"
          rel="noopener"
        >
          Lien vers le modèle de donnée Mémoire
        </a>
        <br />
      </div>
    </div>
  );
}
