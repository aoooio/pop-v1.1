import Mapping from "../services/mapping";
import Notice from "./Notice";
import validator from "validator";

export default class Joconde extends Notice {
  constructor(body) {
    super(body, "joconde");

    if (body.REFIM) {
      this.IMG = this.extractIMGNames(body.REFIM).map(e => `joconde/${this.REF}/${e}`);
    }

    if (body.LOCA) {
      const { LOCA, MANQUANT, MANQUANT_COM } = this.extractManquant(body.LOCA, body.MANQUANT, body.MANQUANT_COM);
      this.LOCA = body.LOCA = LOCA;
      this.MANQUANT = body.MANQUANT = MANQUANT;
      this.MANQUANT_COM = body.MANQUANT_COM = MANQUANT_COM;
    }

    // ADD Boring stuff in order to split text to check for the thesaurus
    const obj = {};
    obj["AUTR"] = /[(,);#]/g;
    obj["DECV"] = /[(,);#]/g;
    obj["DENO"] = /[(,);#]/g;
    obj["DOMN"] = /[(,);#]/g;
    obj["ECOL"] = /[(,);#]/g;
    obj["EPOQ"] = /[(,);#]/g;
    obj["GENE"] = /[(,);#]/g;
    obj["INSC"] = /[(,);#]/g;
    obj["LIEUX"] = /[(,);#]/g;
    obj["LOCA"] = /[(,);#]/g;
    obj["PEOC"] = /[(,);#]/g;
    obj["PERI"] = /[(,);#]/g;
    obj["PERU"] = /[(,);#]/g;
    obj["REPR"] = /[(,);#]/g;
    obj["SREP"] = /[(,);#]/g;
    obj["TECH"] = /[(,);#]/g;
    obj["UTIL"] = /[(,);#]/g;

    for (let key in obj) {
      this._mapping[key].thesaurus_separator = obj[key];
    }
  }

  validate(body) {
    super.validate(body);
    //WWW doit contenir une liste d'urls valides
    const arr = body.WWW;
    if(arr){
      for(let i=0; i<arr.length; i++){
        if(arr[i] && !validator.isURL(arr[i])){
          this._warnings.push(`Le champ WWW doit être une URL valide`);
        }
      }
    }

    ["LVID"]
      .filter(prop => body[prop] && !validator.isURL(body[prop]))
      .forEach(prop => this._warnings.push(`Le champ ${prop} doit être une URL valide`));
  }

  extractManquant = function(loca, manquant, manquantcom) {
    if(loca.indexOf("; manquant") !== -1){
      let array = loca.split("; manquant");
      return { LOCA:array[0] + array[1], MANQUANT:["manquant"], MANQUANT_COM: manquantcom };
    }

    if(loca.indexOf("; volé") !== -1){
      let array = loca.split("; volé");
      return { LOCA:array[0] + array[1], MANQUANT:['volé'], MANQUANT_COM: manquantcom };
    }

    if (["; disparu", "; localisation inconnue", "; pillé"].some(e => loca.indexOf(e) !== -1)) {
      let element = ["; disparu", "; localisation inconnue", "; pillé"].find(e => loca.indexOf(e) !== -1);
      return this.addManquantCom(loca, manquantcom, element);
    }

    return { LOCA: loca, MANQUANT: manquant, MANQUANT_COM: manquantcom };
  };

  addManquantCom = function(loca, manquantcom, str){
    let array = loca.split(str);
    if(typeof manquantcom !== "undefined" && manquantcom !== "" && manquantcom !== " "){
      manquantcom = manquantcom + " " + str;
    }else{
      const value = str.split("; ");
      manquantcom = value[1];
    }
    return { LOCA:array[0] + array[1], MANQUANT:["manquant"], MANQUANT_COM: manquantcom };
  }

  extractIMGNames = function(str) {
    if (!str) {
      return [];
    }
    let tempImages = str.split(";");
    return tempImages.map(e => {
      let name = e.split(",")[0];
      return Joconde.convertLongNameToShort(name);
    });
  };
}

Joconde.has = function(key) {
  return Mapping.joconde[key] !== undefined;
};

Joconde.convertLongNameToShort = function(str) {
  return str
    .substring(str.lastIndexOf("/") + 1)
    .replace(/_[a-zA-Z0-9]\./g, ".")
    .replace(/^.*[\\\/]/g, "")
    .replace(/[a-zA-Z0-9]*_/g, "")
    .toLowerCase();
};
