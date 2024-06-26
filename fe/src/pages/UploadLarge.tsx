import React, { useRef, useState } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { calcFileMD5 } from './index'

interface IUploadProps {
  url: string
  file: File
  fileMd5: any
  fileSize: number
  chunkSize: number
}

interface iUploadChunkProps {
  url: string
  chunk: any
  chunkIndex: number
  fileMd5: any
  fileName: string
}


const UploadLarge = () => {
  const [fileList, setFileList] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const chunksNum = useRef<number>(0)
  const successNum = useRef<number>(0)

  const concatFiles = (url: string, name: string, md5: any) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        md5,
      }),
    })
  }

  const handleUpload = async () => {
    const formData = new FormData()
    fileList.forEach((file, index) => {
      formData.append('file.' + index, file)
    })
    const [file] = fileList
    const fileMd5 = await calcFileMD5(file)
    setUploading(true)
    await upload({
      url: 'http://localhost:3001/upload/large',
      file,
      fileMd5: fileMd5,
      fileSize: file.size,
      chunkSize: 1 * 1024 * 1024,
    })
    setTimeout(() => {
      concatFiles(
        'http://localhost:3001/upload/concatFiles',
        file.name,
        fileMd5,
      )
        .then((res) => {
          console.log(res)
        })
        .catch((err) => {
          console.log(err)
        })
    }, 1000);
  }

  const upload = ({
    url,
    file,
    fileMd5,
    fileSize,
    chunkSize,
  }: IUploadProps) => {
    const chunks =
      typeof chunkSize === 'number' ? Math.ceil(fileSize / chunkSize) : 1
    chunksNum.current = chunks
    new Array(chunks).fill(true).forEach((_, i) => {
      let start = i * chunkSize
      let end = i + 1 == chunks ? fileSize : (i + 1) * chunkSize
      const chunk = file.slice(start, end) // 对文件进行切割
      return uploadChunk({
        url,
        chunk,
        chunkIndex: i,
        fileMd5,
        fileName: file.name,
      })
        .then((res) => res.json())
        .then(() => {
          setFileList([])
          successNum.current += 1
        })
        .catch(() => {
          message.error('上传失败')
        })
        .finally(() => {
          setUploading(false)
        })
    })
  }



  function uploadChunk({
    url,
    chunk,
    chunkIndex,
    fileMd5,
    fileName,
  }: iUploadChunkProps) {
    const formData = new FormData()
    formData.set('file', chunk, fileMd5 + '-' + chunkIndex)
    formData.set('name', fileName)
    formData.set('timestamp', Date.now().toString())
    return fetch(url, {
      method: 'POST',
      body: formData,
    })
  }

  const beforeUpload = (file: any) => {
    setFileList([file])
    return false
  }

  return (
    <>
      <h2>大文件上传</h2>
      <Upload
        fileList={fileList}
        beforeUpload={beforeUpload}
        maxCount={1}
      >
        <Button icon={<UploadOutlined />}>选择文件</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? '上传中' : '开始上传'}
      </Button>
    </>
  )
}

export default UploadLarge
