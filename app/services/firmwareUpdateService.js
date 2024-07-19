import { NordicDFU, DFUEmitter } from "react-native-nordic-dfu";
import RNFetchBlob from "rn-fetch-blob";
import { digitaloceanSpace } from "./digitalocean_space";

let link;

const FB = RNFetchBlob.config({
  useDownloadManager: false,
  fileCache: true,
  appendExt: "zip"
});

var params = {
  Bucket:'meshpp-ota',
  Prefix: 'test'
};

const expireSeconds = 60

export default class FirmwareUpdateService {
  static DFUEmitter = DFUEmitter;
  static NordicDFU = NordicDFU;
  static FB = FB;
  static RNFB = RNFetchBlob;

  static startDFU(device, path) {
    return NordicDFU.startDFU({
      deviceAddress: device.id,
      name: device.name,
      filePath: path
    });
  }

  static getAllFileNames() {
    return new Promise((resolve, reject) => {
      digitaloceanSpace.listObjects(params, function(err, data) {
        if (err) reject({ message: 'Error finding the bucket content', error: err });
        else {
          resolve(data)
        }
      })
    })
  }

  static getFileURL(name) {
    console.log('Getting file url!')
    return new Promise((resolve, reject) => {
      url = digitaloceanSpace.getSignedUrl('getObject', {
        Bucket: 'meshpp-ota',
        Key: name,
        Expires: expireSeconds
      })
      if (url === '') {
        reject({ message: 'Invalid Link!' });
      }
      else {
        resolve(url);
      }
    })
  }

  static downloadFirmware(link) {
    return FB.fetch("GET", link);
  }

  static delteFirmware(filepath) {
    return RNFetchBlob.fs.unlink(filepath);
  }
} 