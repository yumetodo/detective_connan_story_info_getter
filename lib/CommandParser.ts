const help = `
NAME
        detective_connan_story_info_getter - Great Detective Connan's animation story utility
SYNOPSIS
        detective_connan_story_info_getter <operation>
DESCRIPTION
        detective_connan_story_info_getter is a non-official utility tools to
        get infromation about Great Detective Connan's animation story.
OPERATIONS
EXAMPLES
BUGS
AUTHORS
        yumetodo <yume-wikijp@live.jp>
`;
const request1ParamList = ['StoryNum', 'Date', 'Titile'];
const request2ParamList = ['DateRange'];
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
export function parseCommandLine(argv: string[]): OperatorAndOptions | undefined {
  switch (argv.length) {
    case 0:
    case 1:
      console.error('too few arguments', help);
      return;
    case 2:
      console.error('missing paramater', help);
      return;
    default:
      try {
        if (request1ParamList.includes(argv[1])) {
          return { ...parseOptions(argv, 3), operator: argv[1], params: [argv[2]] };
        } else if (request2ParamList.includes(argv[1])) {
          if (argv.length < 4) {
            throw new Error('missing paramater');
          }
          return { ...parseOptions(argv, 4), operator: argv[1], params: [argv[2], argv[3]] };
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
