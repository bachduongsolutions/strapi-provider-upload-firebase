"use strict";

// Module dependencies
const admin = require("firebase-admin");

// Public Dependencies
const { join, normalize } = require("path");

const winStrJoin = function (...paths) {
  return encodeURIComponent(
    normalize(join(...paths))
      .replace(/\\/g, "/")
      .replace(/^\//g, "")
  );
};

module.exports = {
  init(config) {
    admin.initializeApp({
      credential: admin.credential.cert(config.serviceAccount),
      storageBucket: config.bucket,
    });

    const bucket = admin.storage().bucket();
    const folder = config.folder || "";

    return {
      upload(file) {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          const filename = `${path}${file.hash}${file.ext}`;
          const buff = Buffer.from(file.buffer, "binary");
          const remoteFile = bucket.file(`${folder}/${filename}`);
          remoteFile.save(
            buff,
            {
              resumable: false,
              contentType: file.mime,
              public: true,
            },
            (err) => {
              if (err) {
                console.log(err);
                reject(err);
              }

              file.url = `https://firebasestorage.googleapis.com/v0/b/${
                config.bucket
              }/o/${winStrJoin(folder, filename)}?alt=media`;
              resolve();
            }
          );
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          const filename = `${path}${file.hash}${file.ext}`;
          const remoteFile = bucket.file(winStrJoin(folder, filename));
          remoteFile.delete((err, _) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      },
    };
  },
};