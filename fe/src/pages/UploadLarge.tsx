import React, { useRef, useState } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { asyncPool, calcFileMD5, checkFileExist } from './utils'

interface IUploadProps {
  url: string
  file: File
  fileMd5: any
  fileSize: number
  chunkSize: number
  chunkIds: string
  poolLimit: number
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

  const handleUpload = async () => {
    setUploading(true)
    chunksNum.current = 0
    successNum.current = 0
    const formData = new FormData()
    fileList.forEach((file, index) => {
      formData.append('file.' + index, file)
    })
    const [file] = fileList
    const fileMd5 = await calcFileMD5(file)
    // 判断文件是否已存在
    const fileStatus: any = await checkFileExist(
      'http://localhost:3001/upload/exists',
      file.name,
      fileMd5,
    )
    if (fileStatus.data && fileStatus.data.isExists) {
      alert('文件已上传[秒传]')
      return setUploading(false)
    } else {
      console.log('已上传的分块列表：', fileStatus?.data?.chunkIds)
      await upload({
        url: 'http://localhost:3001/upload/large',
        file, // 文件对象
        fileMd5: fileMd5, // 文件 MD5 值
        fileSize: file.size, // 文件大小
        chunkSize: 1 * 1024 * 1024, // 分块大小
        chunkIds: fileStatus?.data?.chunkIds, // 已上传的分块列表
        poolLimit: 3, // 限制的并发数
      })
      concatFiles(
        'http://localhost:3001/upload/concatFiles',
        file.name,
        fileMd5,
      )
        .then((res) => {
          console.log(res)
          alert('上传成功')
          setUploading(false)
        })
        .catch((err) => {
          console.log(err)
          setUploading(false)
        })
    }
  }

  const upload = ({
    url,
    file,
    fileMd5,
    fileSize,
    chunkSize,
    chunkIds,
    poolLimit = 1,
  }: IUploadProps) => {
    const chunks =
      typeof chunkSize === 'number' ? Math.ceil(fileSize / chunkSize) : 1
    chunksNum.current = chunks
    return asyncPool(poolLimit, [...new Array(chunks).keys()], (i: number) => {
      if (chunkIds.indexOf(i + '') !== -1) {
        // 已上传的分块直接跳过
        return Promise.resolve()
      }
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

  const onRemove = (file: any) => {
    const index = fileList.indexOf(file)
    const newFileList = fileList.slice()
    newFileList.splice(index, 1)
    setFileList(newFileList)
  }

  const beforeUpload = (file: any) => {
    setFileList([file])
    return false
  }

  return (
    <div style={{ padding: '32px' }}>
      <h2>大文件上传</h2>
      <Upload
        fileList={fileList}
        onRemove={onRemove}
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
    </div>
  )
}

export default UploadLarge
