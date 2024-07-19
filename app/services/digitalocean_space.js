//https://docs.digitalocean.com/products/spaces/resources/s3-sdk-examples/

const AWS = require('aws-sdk');

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const client = new AWS.S3({
    accessKeyId: "CTC5QAKSLYLC55WQZVDQ",
    secretAccessKey: "m+qMfshaWIxjgbThljT25PTeDvlsevy2QARHXKa6NEU",
    endpoint: spacesEndpoint
})

export const digitaloceanSpace = client
