const rewire = require('rewire')
const app = rewire('../')
const chai = require('chai')
const sinon = require('sinon')
const request = require('supertest')
const expect = chai.expect

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

// Example Url
// https://analysis.dq.homeoffice.gov.uk/raw/index.js/s4/raw/2018/01/12/RAW_20180112_1929_1170.zip/1929/2018-01-12T19-29-44Z_<GUID>_Raw.txt
// E:\RAW_ARCHIVE/20180112/RAW_20180112_1929_1170.zip/1929/2018-01-12T19-29-44Z_<GUID>_Raw.txt

// {
//   key: "20180112/RAW_20180112_1929_1170.zip",
//     Bucket: "whatever",
//   locationinsidezip: "1929/2018-01-12T19-29-44Z_<GUID>_Raw.txt"
//
// }
// E:\RAW_ARCHIVE/20180112/RAW_20180112_1929_1170.zip/1929/2018-01-12T19-29-44Z_<GUID>_Raw.txt
const valid_zip_buffer = Buffer.from('UEsDBAoAAAAAADJUK0wAAAAAAAAAAAAAAAAIABAAZmlsZWRpci9VWAwAqUBXWn89V1r2ARQAUEsDBBQACAAIADJUK0wAAAAAAAAAAAAAAAAQABAAZmlsZWRpci9maWxlbmFtZVVYDABjPldafz1XWvYBFABLy89PSiziAgBQSwcIR5cssgkAAAAHAAAAUEsBAhUDCgAAAAAAMlQrTAAAAAAAAAAAAAAAAAgADAAAAAAAAAAAQO1BAAAAAGZpbGVkaXIvVVgIAKlAV1p/PVdaUEsBAhUDFAAIAAgAMlQrTEeXLLIJAAAABwAAABAADAAAAAAAAAAAQKSBNgAAAGZpbGVkaXIvZmlsZW5hbWVVWAgAYz5XWn89V1pQSwUGAAAAAAIAAgCMAAAAjQAAAAAA', 'base64')

const mock_s3 = params => {
    return {
      promise: () => new Promise((resolve, reject) => {
      if(params.Key === "s4/raw/YYYY/MM/DD/zip_file_fixture.zip")
        return resolve({Body:valid_zip_buffer})
      return reject("NoSuchKey: The specified key does not exist")
    })
  }
}

describe('RMR tool', () => {
  let s3_getObject_stub
  before(() => {
    s3_getObject_stub = sinon.stub(app.__get__('s3'), 'getObject').callsFake(mock_s3)
  })

  after(() => {
    app.__get__('http_server').close()
    s3_getObject_stub.restore()
  })

  describe('get_file_path_in_zip_from_url', () => {
    it('should return the correct path for the zip from the url', () =>
      expect(app.__get__('get_file_path_in_zip_from_url')
      ('/raw/index.js/s4/raw/YYYY/MM/DD/zipfile.zip/filedir/filename.txt'))
        .to.equal('filedir/filename.txt'))
  })

  describe('get_zip_name_from_url', () => {
    it('should return the correct zip name from the url', () =>
      expect(app.__get__('get_zip_name_from_url')
      ('/raw/index.js/s4/raw/YYYY/MM/DD/zipfile.zip/filedir/filename.txt'))
        .to.equal('s4/raw/YYYY/MM/DD/zipfile.zip'))
  })

  describe('read_file_from_zip_buffer', () => {
    it('should return foobar', () => {
      expect(app.__get__('read_file_from_zip_buffer')(valid_zip_buffer, 'filedir/filename')).to.equal('foobar\n')
    })
  });

  describe('request_handler', () => {
    const res = {
      writeHead: sinon.stub(),
      end: sinon.stub()
    }
    const req = {url: '/raw/index.js/s4/raw/YYYY/MM/DD/zip_file_fixture.zip/filedir/filename'}
    it('should write the head as html', () =>
      app.__get__('request_handler')(req, res)
        .then(() =>
          expect(res.writeHead).to.be.calledWith(200, {'Content-Type': 'text/html'}))
    )

    it('should return everything we expect', () =>
      app.__get__('request_handler')(req, res)
        .then(() =>
          expect(res.end).to.be.calledWithMatch('foobar')
        )
    )
    it('should return a 404 for files not found', () =>
      app.__get__('request_handler')({url: 'not_a_file'}, res)
        .then(() =>
          expect(res.writeHead).to.be.calledWithMatch(404)
        )
    )
  })

  describe('Browser Tests', () => {
    it('should display zip contents successfully', () =>
      request(app.__get__('http_server'))
        .get('/raw/index.js/s4/raw/YYYY/MM/DD/zip_file_fixture.zip/filedir/filename')
        .expect(200)
        .then(response =>
          expect(response.text).to.have.string('foobar')
        )
    )
    it('should 404 on unknown path in zip', () =>
      request(app.__get__('http_server'))
        .get('/raw/index.js/s4/raw/YYYY/MM/DD/zip_file_fixture.zip/filedir/nothere')
        .expect(404)
    )
    it('should 404 on unknown path to zip', () =>
      request(app.__get__('http_server'))
        .get('/raw/index.js/s4/raw/YYYY/MM/DD/nothere.zip/filedir/filename')
        .expect(404)
    )
  })
})
