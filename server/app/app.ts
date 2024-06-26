import express = require('express');
import path = require('path');
import bodyParser = require('body-parser');
import multer = require('multer')
import fs = require("fs")
const fse = require("fs-extra");
const util = require("util");

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

const port = 3001;
const defaultPath = './upload/';
const uploadDir = path.join(__dirname, defaultPath);

const app: express.Application = express();

const baseConfig = {
  dest: uploadDir,
  limits: {
    files: 9
  }
}

const uploadLarge = multer({
  ...baseConfig,
  limits: {
    ...baseConfig.limits,
    fieldSize: 2 * 1024 * 1024
  }
})

app.use(uploadLarge.any())
app.use(express.static(path.join(__dirname, defaultPath)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'content-type,Content-Length, Authorization,Origin,Accept,X-Requested-With'); // 允许的请求头
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.post('/upload/large', uploadLarge.single('file'), (req: any, res) => {
  const { originalname, filename } = req?.files?.[0] || {}
  // originalname 为【 MD5-索引 】格式
  const [md5, targetIndex] = originalname.split('-')
  const oldPath = path.resolve(__dirname, uploadDir, filename)
  const newPath = path.resolve(__dirname, uploadDir, md5, targetIndex)
  // 判断目录是否存在，不存在则创建，存在则移动文件
  dirExists(path.resolve(__dirname, uploadDir, md5)).then((exists: any) => {
    // 这一步的原因是 multer 会将文件上传到 uploadDir 目录下，而我们需要将文件移动到 /upload/[md5]/[index] 下
    fse.move(oldPath, newPath, (err: any) => {
      if (err) {
        // 移动失败，删除文件，后续这里需要删掉，采用断点续传
        fse.remove(path.resolve(__dirname, uploadDir, md5))
        res.send({
          data: err,
          message: '上传失败',
          code: 0
        })
      } else {
        res.send({
          data: req.files,
          message: '上传成功',
          code: 1
        })
      }
    })
  }).catch((err: any) => {
    console.log('err')
  })
})

app.post('/upload/concatFiles', async (req: any, res) => {
  const { name: fileName, md5: fileMd5 } = req.body;
  await concatFiles(
    path.join(uploadDir, fileMd5),
    path.join(uploadDir, fileName)
  );
  res.send({
    status: "success",
    data: {
      url: `http://localhost:3001/${fileName}`,
    },
  })
})

async function concatFiles(sourceDir: string, targetPath: string) {
  const readFile = (file: any, ws: any) =>
    new Promise((resolve, reject) => {
      fs.createReadStream(file)
        .on("data", (data) => ws.write(data))
        .on("end", resolve)
        .on("error", reject);
    });
  const files = await readdir(sourceDir);
  const sortedFiles = files.sort((a: any, b: any) => a - b);
  const writeStream = fs.createWriteStream(targetPath);
  for (const file of sortedFiles) {
    let filePath = path.join(sourceDir, file);
    await readFile(filePath, writeStream);
    await unlink(filePath); // 删除已合并的分块
  }
  await fs.rmdirSync(sourceDir)
  writeStream.end();
}

app.listen(port, function () {
  console.info(`listening on port ${port}!`);
});

module.exports = app;

async function dirExists(dir: string) {
  let isExists = await getStat(dir) as fs.Stats;
  //如果该路径存在，并且是目录
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) {
    //如果该路径存在，但是是文件
    return false;
  }
  //如果该路径不存在，拿到上级路径
  let tempDir = path.parse(dir).dir;
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await dirExists(tempDir);
  let mkdirStatus;
  if (status) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
}

function mkdir(dir: string) {
  return new Promise((resolve) => {
    fse.mkdir(dir, (err: any) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    })
  })
}

function getStat(path: string) {
  return new Promise((resolve, reject) => {
    // 获取文件信息
    fse.stat(path, (err: any, stats: any) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    })
  })
}