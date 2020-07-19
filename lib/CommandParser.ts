const help = `
NAME
    detective_connan_story_info_getter - Great Detective Connan's animation story utility
SYNOPSIS
    detective_connan_story_info_getter <operation>
DESCRIPTION
    detective_connan_story_info_getter is a non-official utility tools to
    get infromation about Great Detective Connan's animation story.
OPERATIONS
    StoryNum <number>
        search by story number.
    Date <date>
        search by the date broadcasted.
        ex.)
        - 20191123
        - "2020-01-04 18:00:00"

        More information about date format, watch
        https://momentjs.com/docs/#/parsing/string/
    DateRange <first date> <last date>
        search by range of dates
    Titile <title>
        search by submuch of story title.
    -h, --help
        print help
OPTIONS
    --json
        output as json
    --tz <timezone>
        timezone to paesr date. deafult is "Asia/Tokyo". Timezone identifier is listed below:
        https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
EXAMPLES
    npx detective_connan_story_info_getter storyNum 231
    npx detective_connan_story_info_getter date 20191123 --tz Asia/Tokyo
    npx detective_connan_story_info_getter dateRange 20191123 "2020-01-04 18:00:00"
    npx detective_connan_story_info_getter titile "ジェットコースター殺人事件" --json
BUGS
    https://github.com/yumetodo/detective_connan_story_info_getter/issues
AUTHORS
    yumetodo <yume-wikijp@live.jp>
`;
const request1ParamList = ['storyNum', 'date', 'titile'];
const request2ParamList = ['dateRange'];
interface Options {
  tz?: string;
  asJson: boolean;
}
export interface OperatorAndOptions extends Options {
  operator: string;
  params: string[];
}
function parseOptions(argv: string[], start: number): Options {
  const re: Options = { asJson: false };
  for (let i = start; i < argv.length; ++i) {
    switch (argv[i]) {
      case '--json':
        re.asJson = true;
        break;
      case '--tz':
        if (argv.length <= i + 1) throw new Error('missing tz string');
        re.tz = argv[i + 1];
        ++i;
        break;
      default:
        throw new Error('unkonwn option');
    }
  }
  return re;
}
export function parseCommandLine(argv: string[]): OperatorAndOptions | null | undefined {
  switch (argv.length) {
    case 0:
    case 1:
    case 2:
      console.error('too few arguments', help);
      return;
    case 3:
      if (['-h', '--help'].includes(argv[2])) {
        console.error(help);
        return null;
      }
      console.error('missing operator', help);
      return;
    default:
      try {
        if (request1ParamList.includes(argv[2])) {
          return { ...parseOptions(argv, 4), operator: argv[2], params: [argv[3]] };
        } else if (request2ParamList.includes(argv[2])) {
          if (argv.length < 4) {
            throw new Error('missing paramater');
          }
          return { ...parseOptions(argv, 5), operator: argv[2], params: [argv[3], argv[4]] };
        } else {
          throw new Error('unknown operator');
        }
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message, help);
        }
      }
  }
}
