interface Options {
  tz?: string;
  asJson: boolean;
}
export interface OperatorAndOptions extends Options {
  operator: string;
  params: string[];
}
export function parseCommandLine(argv: string[]): OperatorAndOptions | undefined {
}
