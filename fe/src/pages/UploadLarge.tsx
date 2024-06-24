import React, { useState } from 'react'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const UploadLarge = () => {
  const [fileList, setFileList] = useState<any[]>([])

  const onRemove = () => {
    
  }

  const beforeUpload = () => {
    return false
  }

  return (
    <>
      <h2>大文件上传</h2>
      <Upload
        fileList={fileList}
        onRemove={onRemove}
        beforeUpload={beforeUpload}
        maxCount={1}
      >
        <Button icon={<UploadOutlined />}>选择文件</Button>
      </Upload>
    </>
  )
}

export default UploadLarge
