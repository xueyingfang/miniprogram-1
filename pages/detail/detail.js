Page({
  data:{
    bookInfo: null,
    chapterList: [],
    chapterIndex: 0,
    pageIndex: 0,
    pageText: "",
    pageParagraphs:[], // 新增：当前页的段落数组
    pageArr: [], // 当前章节分页数组
    showCatalog: false, // 侧边目录开关
    pageWordCount: 550, // 每页预估字数，可调整 400~700
    isChapterFirstPage: false, // 新增：是否为本章节第一页
  },
  onLoad(options){
    const bookId = options.id
    wx.request({
      url:`http://127.0.0.1:8000/books/${bookId}`,
      method:"GET",
      success:(res)=>{
        if(res.statusCode ===200){
          const book = res.data
          this.setData({bookInfo:book})
          this.splitChapter(book.content)
        }
      },
      fail(err){
        console.error("获取书籍详情失败",err)
      }
    })
  },

  // ========= splitChapter保持原样 =========
  splitChapter(content){
    // 匹配第X章、第X回
    const reg = /(第[一二三四五六七八九十0-9]+[章回])/g
    const parts = content.split(reg).filter(item=>item.trim() !== "")
    let chapterList = []
    for(let i=0;i<parts.length;i++){
      if(/第[一二三四五六七八九十0-9]+[章回]/.test(parts[i])){
        chapterList.push({
          title: parts[i],
          text: parts[i+1] || ""
        })
        i++
      }else{
        chapterList.push({
          title:"无章节",
          text: parts[i]
        })
      }
    }

    // 没有识别到任何章节标题 → 使用【连续空行】分割章节
    if(chapterList.length === 0){
      const blocks = content.split(/\n\s*\n/); // 连续多个换行/空行分割
      blocks.forEach((block, idx)=>{
        chapterList.push({
          title: `第${idx+1}部分`,
          text: block
        })
      })
    }
    this.setData({chapterList, chapterIndex:0})
    this.renderChapter()
  },

  // ========= 修改renderChapter：切割段落 =========
  renderChapter(){
    const {chapterList, chapterIndex, pageWordCount} = this.data
    const chapter = chapterList[chapterIndex]
    const text = chapter.text
    let pages = []
    for(let i=0;i<text.length;i += pageWordCount){
      pages.push(text.slice(i, i + pageWordCount))
    }
    const currentPageText = pages[0] || ""
    // 核心：按换行分割段落，过滤空行
    const paragraphs = currentPageText.split(/\n/).filter(p=>p.trim() !== "")
    this.setData({
      pageIndex: 0,
      pageArr: pages,
      pageText: currentPageText,
      pageParagraphs: paragraphs, // 存入段落数组
      currentChapter: chapter,
      isChapterFirstPage: true // 切换新章节，一定是本章第一页
    })
  },

  // 点击屏幕判断左右：左=上一页，右=下一页【保持原样】
  onTapScreen(e){
    // 目录打开状态，点击屏幕不翻页
    if(this.data.showCatalog) return;
    const {x} = e.detail
    const windowWidth = wx.getSystemInfoSync().windowWidth
    // 屏幕中线
    const mid = windowWidth / 2
    if(x < mid){
      // 点击左侧：上一页
      this.prevPage()
    }else{
      // 点击右侧：下一页
      this.nextPage()
    }
  },

  // ========= 修改prevPage：翻页后切割段落 =========
  prevPage(){
    let {pageIndex, pageArr, chapterIndex, chapterList} = this.data
    if(pageIndex > 0){
      pageIndex--
      const currentPageText = pageArr[pageIndex]
      const paragraphs = currentPageText.split(/\n/).filter(p=>p.trim() !== "")
      this.setData({
        pageIndex,
        pageText: currentPageText,
        pageParagraphs: paragraphs,
        isChapterFirstPage: (pageIndex === 0) // pageIndex=0才是本章第一页
      })
    }else{
      // 当前章节第一页，切换到上一章
      if(chapterIndex > 0){
        chapterIndex--
        this.setData({chapterIndex})
        this.renderChapter()
        // 直接定位到上一章最后一页
        const newPages = this.data.pageArr
        const lastText = newPages[newPages.length -1]
        const paragraphs = lastText.split(/\n/).filter(p=>p.trim() !== "")
        this.setData({
          pageIndex: newPages.length -1,
          pageText: lastText,
          pageParagraphs: paragraphs,
          isChapterFirstPage: false // 跳转到上一章的末尾，不是第一页
        })
      }else{
        wx.showToast({title:"已经是全书开头",icon:"none"})
      }
    }
  },

  // ========= 修改nextPage：翻页后切割段落 =========
  nextPage(){
    let {pageIndex, pageArr, chapterIndex, chapterList} = this.data
    if(pageIndex < pageArr.length -1){
      pageIndex++
      const currentPageText = pageArr[pageIndex]
      const paragraphs = currentPageText.split(/\n/).filter(p=>p.trim() !== "")
      this.setData({
        pageIndex,
        pageText: currentPageText,
        pageParagraphs: paragraphs,
        isChapterFirstPage: (pageIndex === 0)
      })
    }else{
      // 当前章节最后一页，进入下一章
      if(chapterIndex < chapterList.length -1){
        chapterIndex++
        this.setData({chapterIndex})
        this.renderChapter()
      }else{
        wx.showToast({title:"已经读完本书",icon:"none"})
      }
    }
  },

  // 打开侧边目录【原样保留】
  openCatalog(){
    this.setData({showCatalog:true})
  },
  // 关闭目录【原样保留】
  closeCatalog(){
    this.setData({showCatalog:false})
  },
  stopEvent(){
    // 阻止目录内部点击冒泡，防止关闭目录
  },
  // 点击目录项，跳转到对应章节第一页【原样保留】
  jumpChapter(e){
    const idx = e.currentTarget.dataset.index
    this.setData({chapterIndex:idx, showCatalog:false})
    this.renderChapter()
  },
  // 【手势侧滑唤起目录】【原样保留】
  onTouchStart(e) {
    this.touchStartX = e.touches[0].pageX
  },
  onTouchEnd(e) {
    const endX = e.touches[0].pageX
    const diff = endX - this.touchStartX
    // 从左向右滑动，拉出目录
    if(diff > 80){
      this.openCatalog()
    }
  }
})
