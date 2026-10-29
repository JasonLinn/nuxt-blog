import { createSiteImageRewriter } from '../../utils/site-images.js'
import publicImageFiles from '#public-image-files'

const rewriter = createSiteImageRewriter(publicImageFiles)

// raw.githubusercontent.com 上已部署的圖片改用本站網址
export const toSiteImageUrl = rewriter.rewrite
export const withSiteImages = rewriter.rewriteRow
