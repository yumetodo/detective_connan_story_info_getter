const fetch = require('node-fetch');
const moment = require('moment');
if (process.argv.length !== 4) {
  throw new SyntaxError('invalid argument length');
}
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
const [before, after] = parseArgv();
/**
 * @param {string} storyNum
 */
const formatStoryNum = storyNum => (storyNum.startsWith('R') ? storyNum.slice(1) : storyNum);
const main = async () => {
  const data = await fetch('http://www.ytv.co.jp/conan/data/story.json').then(r => r.json());
  if (!Array.isArray(data.item)) {
    throw new Error("ytv's json format might be changed.");
  }
  /**
   * @type {{oaDateId: string, title: string, story_num: string, url: string}[]}
   */
  const i = data.item;
  i.filter(v => moment(v.oaDateId).isBetween(before, after, null, '[]'))
    .reverse()
    .forEach((v, i) => {
      console.log(
        `${i + 1}\t名探偵コナン第${formatStoryNum(v.story_num)}話\t${v.title}\t${moment(v.oaDateId).format('Y/M/D')}`
      );
    });
};
main().catch(e => console.error(e));
