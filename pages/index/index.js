Page({
  data: {
    bookList: [],
    showPopup: false,
    showDeletePopup: false,
    currentDelId: null,
    fileTip: "",
    form: {
      title: "",
      author: "",
      cover: "",
      desc: "",
      content: ""
    }
  },
  onLoad() {
    this.getBooks()
  },
  onShow() {
    this.getBooks()
  },

  // 获取书籍列表
  getBooks() {
    wx.request({
      url: "http://127.0.0.1:8000/books/",
      method: "GET",
      success: (res) => {
        if(res.statusCode === 200){
          this.setData({
            bookList: res.data
          })
        }
      },
      fail(err) {
        console.error("获取书籍失败", err)
      }
    })
  },

  // 【导入TXT按钮事件】选择本地txt
  openPopup() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt'],
      success: (res) => {
        const file = res.tempFiles[0]
        // 提取文件名作为书名，去掉 .txt后缀
        let fileName = file.name
        let bookTitle = fileName.replace(/\.txt$/i, '')

        // 读取txt文本内容
        wx.getFileSystemManager().readFile({
          filePath: file.path,
          encoding: 'utf8',
          success: (readRes) => {
            const content = readRes.data
            // 提交到后端新增接口
            wx.request({
              url: "http://127.0.0.1:8000/books/",
              method: "POST",
              data: {
                title: bookTitle,
                author: "未知作者",
                cover: "",
                desc: "",
                content: content
              },
              success: (postRes) => {
                wx.showToast({ title: "添加成功" })
                // ✅ 添加成功，立刻重新拉取列表刷新页面
                this.getBooks()
              },
              fail: err => {
                wx.showToast({ title: "添加失败", icon:"error" })
                console.error(err)
              }
            })
          }
        })
      }
    })
  },

  // 长按书籍：弹出删除确认
  showDeleteMenu(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentDelId: id,
      showDeletePopup: true
    })
  },

  // 确认删除
  confirmDelete() {
    const delId = this.data.currentDelId
    wx.request({
      url: `http://127.0.0.1:8000/books/${delId}`,
      method: "DELETE",
      success: (res) => {
        wx.showToast({title:"删除成功"})
        this.setData({ showDeletePopup: false })
        // ✅ 删除成功，立刻刷新书籍列表
        this.getBooks()
      },
      fail: err => {
        wx.showToast({ title: "删除失败", icon:"error" })
      }
    })
  },

  // 取消删除
  closeDeletePopup(){
    this.setData({
      showDeletePopup: false,
      currentDelId: null
    })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
