#!/usr/bin/env node
'use strict'

const fetch = require('node-fetch');
const moment = require('moment');
/**
 * @param {string} input
 */
const createMoment = input => {
  const re = moment(input);
  if (!re.isValid()) {
    throw new SyntaxError(`${input} is not a valid input`);
  }
  return re;
};
/**
 * @returns {[moment.Moment, moment.Moment]}
 */
const parseArgv = () => {
  const before = createMoment(process.argv[2]);
  const after = createMoment(process.argv[3]);
  return before.isBefore(after) ? [before, after] : [after, before];
};
/**
 * @param {string} storyNum
 */
const formatStoryNum = storyNum => (storyNum.startsWith('R') ? storyNum.slice(1) : storyNum);
/**
 * @param {(v: {oaDateId: string, title: string, story_num: string, url: string}) => boolean} cond
 */
const findImpl = async cond => {
  const data = await fetch('http://www.ytv.co.jp/conan/data/story.json').then(r => r.json());
  if (!Array.isArray(data.item)) {
    throw new Error("ytv's json format might be changed.");
  }
  /**
   * @type {{oaDateId: string, title: string, story_num: string, url: string}[]}
   */
  const i = data.item;
  return i.filter(cond).reverse();
};
const find = async () => {
  switch (process.argv.length) {
    case 4: {
      const [before, after] = parseArgv();
      return findImpl(v => moment(v.oaDateId).isBetween(before, after, null, '[]'));
    }
    case 3: {
      const key = process.argv[2];
      if (key.match(/^[0-9]{1,4}$/)) {
        const re = await findImpl(v => formatStoryNum(v.story_num) === key);
        if (re.length !== 0) return re;
      }
      const re = await findImpl(v => v.title.includes(key));
      if (re.length !== 0) return re;
      // facllback search as Date to avoid Deprecation warning.
      // https://github.com/moment/moment/issues/2469
      // > Deprecation warning: value provided is not in a recognized RFC2822 or ISO format.
      // > moment construction falls back to js Date(), which is not reliable across all browsers and versions.
      // > Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release.
      // > Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.
      const maybeDate = moment(key);
      if (maybeDate.isValid()) {
        return findImpl(v => moment(v.oaDateId).isSame(maybeDate));
      }
    }
    // eslint-disable-next-line no-fallthrough
    default:
      throw new SyntaxError('invalid argument length');
  }
};
const main = async () => {
  find().then(v =>
    v.forEach((v, i) => {
      console.log(
        `${i + 1},名探偵コナン第${formatStoryNum(v.story_num)}話,${v.title},${moment(v.oaDateId).format('Y/M/D')}`
      );
    })
  );
};
main().catch(e => console.error(e));
