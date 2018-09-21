const { api_url } = require("../config.js");
import "isomorphic-fetch";
import request from "./request";

/**
 * Buisness level access to POP API.
 */
class api {
  createUser(email, group, role, institution, prenom, nom) {
    const obj = { email, group, role, institution, prenom, nom };
    return request.post(
      `${api_url}/auth/signup`,
      JSON.stringify(obj),
      "application/json"
    );
  }

  signin(email, password) {
    const obj = { email, password };
    return request.post(
      `${api_url}/auth/signin`,
      JSON.stringify(obj),
      "application/json"
    );
  }

  getUser(token) {
    return request.get(`${api_url}/auth/user`, {
      headers: {
        Authorization: token
      }
    });
  }

  updatePassword(email, ppwd, pwd1, pwd2) {
    const obj = { email, ppwd, pwd1, pwd2 };
    return request.post(
      `${api_url}/auth/updatePassword`,
      JSON.stringify(obj),
      "application/json"
    );
  }

  forgetPassword(email) {
    const obj = { email };
    return request.post(
      `${api_url}/auth/forgetPassword`,
      JSON.stringify(obj),
      "application/json"
    );
  }

  getUsers(group) {
    return request.get(`${api_url}/auth?group=${group}`);
  }

  sendReport(subject, to, body) {
    const obj = { subject, to, body };
    return request.post(
      `${api_url}/mail`,
      JSON.stringify(obj),
      "application/json"
    );
  }

  updateNotice(ref, collection, data, images = []) {
    let formData = new FormData();
    formData.append("notice", JSON.stringify(data));
    for (let i = 0; i < images.length; i++) {
      formData.append("file", images[i]);
    }
    return request.put(`${api_url}/${collection}/${ref}`, formData);
  }

  createNotice(collection, data, images = []) {
    for (let propName in data) {
      //clean object
      if (!data[propName]) {
        delete data[propName];
      }
    }
    let formData = new FormData();
    formData.append("notice", JSON.stringify(data));

    for (let i = 0; i < images.length; i++) {
      formData.append("file", images[i]);
    }
    return request.post(`${api_url}/${collection}`, formData);
  }

  getNotice(collection, ref) {
    return request.get(`${api_url}/${collection}/${ref}`);
  }

  deleteNotice(collection, ref) {
    return request.delete(`${api_url}/${collection}/${ref}`);
  }

  updateThesaurus(thesaurusId, str) {
    return request.get(`${api_url}/thesaurus/update?id=${thesaurusId}`);
  }

  getThesaurus(thesaurusId, str) {
    return request.get(
      `${api_url}/thesaurus/search?id=${thesaurusId}&value=${str}`
    );
  }

  validateWithThesaurus(thesaurusId, str) {
    return request.get(
      `${api_url}/thesaurus/validate?id=${thesaurusId}&value=${str}`
    );
  }
}

const apiObject = new api();
export default apiObject;
