import SparkMD5 from 'spark-md5'

export const calcFileMD5 = (file: File) => {
  return new Promise((resolve, reject) => {
    let chunkSize = 2097152, // 2M
      chunks = Math.ceil(file.size / chunkSize),
      currentChunk = 0,
      spark = new SparkMD5.ArrayBuffer(),
      fileReader = new FileReader()

    fileReader.onload = (e: any) => {
      spark.append(e.target.result)
      currentChunk++
      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = () => {
      reject(fileReader.error)
    }

    function loadNext() {
      let start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }
    loadNext()
  })
}