import { parseCommandLine, OperatorAndOptions } from '../lib/CommandParser';
describe('parseCommandLine', () => {
  it('basic', () => {
    expect(parseCommandLine(['foo', 'StoryNum', '231'])).toStrictEqual({
      asJson: false,
      operator: 'StoryNum',
      params: ['231'],
    } as OperatorAndOptions);
    expect(parseCommandLine(['foo', 'Date', '20191123', '--tz', 'Asia/Tokyo'])).toStrictEqual({
      asJson: false,
      operator: 'Date',
      params: ['20191123'],
      tz: 'Asia/Tokyo',
    } as OperatorAndOptions);
    expect(parseCommandLine(['foo', 'DateRange', '20191123', '2020-01-04 18:00:00'])).toStrictEqual({
      asJson: false,
      operator: 'DateRange',
      params: ['20191123', '2020-01-04 18:00:00'],
    } as OperatorAndOptions);
    expect(parseCommandLine(['foo', 'Titile', 'ジェットコースター殺人事件', '--json'])).toStrictEqual({
      asJson: true,
      operator: 'Titile',
      params: ['ジェットコースター殺人事件'],
    } as OperatorAndOptions);
  });
});
