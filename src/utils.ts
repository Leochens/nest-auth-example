// @ts-nocheck
let request = require('request-promise') // 使用request-promise模块进行HTTP请求，需要先安装
let cheerio = require('cheerio') // 使用cheerio模块进行HTML解析，需要先安装

const getAppData = async (url) => {
    let html = await request({ // 使用request-promise发送HTTP请求获取页面HTML
        url: `${url}?platform=iphone`
    });
    const data = {};
    let $ = cheerio.load(html) // 使用cheerio加载HTML页面
    // 获得logo
    let logoImgs = $('body > div.ember-view > main > div.animation-wrapper.is-visible > section.l-content-width.section.section--hero.product-hero > div ').find('source').attr('srcset');
    logoImgs = logoImgs.split(',').map(url => url.trim().split(' ')?.[0]);
    data.logo = logoImgs[0];
    // 获得描述图片
    const desImgBlocks = $('.l-row.l-row--peek.we-screenshot-viewer__screenshots-list > li > picture').toArray()
    const desImgs = [];
    desImgBlocks.forEach(item => {
        const i = item.childNodes.filter(item => item.type === 'tag')?.[0]
        if (!i) return;
        const p = i.attribs.srcset.split(',')
            .map(url => url.trim().split(' '))
        p.sort((pair1, pair2) => parseInt(pair2[1]) - parseInt(pair1[1]));
        const maxTarget = p?.[0]?.[0]
        if (maxTarget.indexOf('http') !== -1) desImgs.push(maxTarget);
    })
    data.desImgs = desImgs;

    const process = str => str.trim().split('\n').map(item => item.trim()).join(' ')
    // 获得名称和简介
    const title = $('.product-header__title.app-header__title').text();
    data.title = process(title)?.split(' ')?.[0]
    const slogen = $('.product-header__subtitle.app-header__subtitle').text();
    data.slogen = process(slogen);
    const des = $('.we-truncate.we-truncate--multi-line.we-truncate--interactive.we-truncate').text()
    data.des = process(des);

    // appstore评分
    const score = $('.we-customer-ratings__averages__display').text();
    data.score = score;
    // 隐私数据

    const privacy = $('.privacy-type__items.privacy-type__items--single-item').find('.privacy-type__grid-content.privacy-type__data-category-heading').toArray();
    if (privacy.length === 0) {
        data.privacy = ['未收集你的数据']
    } else {
        const arr = [];
        privacy.forEach(item => {
            if (item.type === 'tag') {
                arr.push(item.firstChild.data)
            }
        });
        data.privacy = arr;
    }
    data.privacy = data.privacy.join(',');

    // price
    function generatePriceRange(text) {
        // 使用正则表达式匹配价格
        const prices = text.match(/¥\d+\.\d+/g);
        if(!prices) {
            return '免费使用!'
        }

        // 将价格转换为数字并排序
        const numericPrices = prices?.map(price => parseFloat(price.replace('¥', '')));
        numericPrices.sort((a, b) => a - b);

        // 获取最低价和最高价
        const minPrice = numericPrices[0];
        const maxPrice = numericPrices[numericPrices.length - 1];

        // 生成结果字符串
        const result = `内购价格 ￥${minPrice === maxPrice ? minPrice :`${minPrice} ~ ￥${maxPrice}` }`;
        return result;
    }
    const price = $('body > div.ember-view > main > div.animation-wrapper.is-visible > section.l-content-width.section.section--bordered.section--information > div:nth-child(1) > dl > div:last-child > dd').text();
    data.priceOrigin = process(price)
    data.price = generatePriceRange(data.priceOrigin);

    // Divice
    let divice = $('body > div.ember-view > main > div.animation-wrapper.is-visible > section.l-content-width.section.section--bordered.section--information > div:nth-child(1) > dl > div:nth-child(4) > dd').text();
    process(divice);
    data.divice = []
    if (divice.includes('iOS')) data.divice.push('IOS');
    if (divice.includes('iPad')) data.divice.push('iPad');
    if (divice.includes('Apple Watch')) data.divice.push('Apple Watch');
    // if (divice.includes('Mac')) data.divice.push('Mac');
    // if (divice.includes('Apple Vision')) data.divice.push('Apple Vision');
    data.divice = data.divice.join(',')

    const res = {
        texts: {
            title: data.title,
            slogen: data.slogen,
            des: data.des.slice(0, 180),
            score: data.score,
            price:data.price,
            privacy: data.privacy,
            divice: data.divice,
            review: '罐头的评价在这里，罐头的评价在这里罐头的评价在这里罐头的评价在这里'
        },
        imgs: {
            logo: data.logo,
            pic1: data.desImgs?.[0],
            pic2: data.desImgs?.[1],
            pic3: data.desImgs?.[2],
            pic4: data.desImgs?.[3],
        }
    }
    console.log(res)
    return res;
}
// getData('https://apps.apple.com/cn/app/%E6%8A%96%E9%9F%B3/id1142110895');
// getData('https://apps.apple.com/cn/app/offscreen-%E8%87%AA%E5%BE%8B%E7%95%AA%E8%8C%84%E9%92%9F-%E4%B8%8D%E5%81%9A%E6%89%8B%E6%9C%BA%E6%8E%A7/id1474340105');
// getData('https://apps.apple.com/cn/app/truedot/id6504784441')
// getData('https://apps.apple.com/cn/app/%E6%87%92%E9%A5%AD-%E5%8E%A8%E6%88%BF%E9%87%8C%E7%9A%84%E7%BE%8E%E9%A3%9F%E6%8C%87%E5%8D%97/id1377082167')
export default getAppData;