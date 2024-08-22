const AWS = require('aws-sdk')
const http = require('http')
const admzip = require('adm-zip')
const {BUCKET_NAME} = process.env


let s3 = new AWS.S3({
  logger: console,
  stats: {
    retries: true,
    timer: false,
    http: true
  },
  params: {
    Bucket: BUCKET_NAME
  },
  http: {
   connect_timeout: 1
  }
})

const get_zip_name_from_url = url => /.*\/(.*\/.*\/.*\/.*\/.*\/.*)\/.*\/.*$/.exec(url)[1]

const get_file_path_in_zip_from_url = url => /.*\/(.*\/.*)$/.exec(url)[1]

const read_file_from_zip_buffer = (buffer, file_path) =>
  new admzip(buffer).readAsText(file_path)

const request_handler = async (req, res) => {
  try {
    const file_path = get_file_path_in_zip_from_url(req.url);
    const zip_name = get_zip_name_from_url(req.url);

    const payload = await s3.getObject({ Key: zip_name }).promise()
      .then(response => read_file_from_zip_buffer(response.Body, file_path))
    if (payload.length === 0)
      throw('Not Found')
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(templated_response(payload))
  }
  catch (e) {
    res.writeHead(404)
    res.end(e.toString())
  }
}

const http_server = http.createServer(request_handler)

http_server.listen(3000)

const templated_response = payload => `<!DOCTYPE html>
<html>
<body>
<font face="courier">
${payload}
</font>
</body>
</html>
`
