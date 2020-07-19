import { parseCommandLine, OperatorAndOptions } from '../lib/CommandParser';
describe('parseCommandLine', () => {
  it('basic', () => {
    expect(parseCommandLine(['node', 'foo', 'storyNum', '231'])).toStrictEqual({
      asJson: false,
      operator: 'storyNum',
      params: ['231'],
    } as OperatorAndOptions);
    expect(parseCommandLine(['node', 'foo', 'date', '20191123', '--tz', 'Asia/Tokyo'])).toStrictEqual({
      asJson: false,
      operator: 'date',
      params: ['20191123'],
      tz: 'Asia/Tokyo',
    } as OperatorAndOptions);
    expect(parseCommandLine(['node', 'foo', 'dateRange', '20191123', '2020-01-04 18:00:00'])).toStrictEqual({
      asJson: false,
      operator: 'dateRange',
      params: ['20191123', '2020-01-04 18:00:00'],
    } as OperatorAndOptions);
    expect(parseCommandLine(['node', 'foo', 'titile', 'ジェットコースター殺人事件', '--json'])).toStrictEqual({
      asJson: true,
      operator: 'titile',
      params: ['ジェットコースター殺人事件'],
    } as OperatorAndOptions);
  });
});
