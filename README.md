# detective_connan_story_info_getter

![Node CI](https://github.com/yumetodo/detective_connan_story_info_getter/workflows/Node%20CI/badge.svg?branch=master)

アニメ名探偵コナンの放送話を検索して列挙するコマンドです。

ytv(読売テレビ)のデータは[古いもの(json形式)](http://www.ytv.co.jp/conan/data/story.json)と[新しいもの(json形式)](https://www.ytv.co.jp/conan/data/case.json)がありますが、この両方を使い、さらに元データの誤りを修復して、検索をします。

出力はカンマ区切りです。もし放送タイトルにカンマが含まれることがあった場合は壊れます(ないでしょ。もしくは`--json`を末尾に渡してあげることでjsonとして出力します。

導入は以下の手順で可能です。

```plain
git clone https://github.com/yumetodo/detective_connan_story_info_getter.git
npm ci
npm run ci
npm link
```

## 放送日の範囲で検索

```sh
detective_connan_story_info_getter dateRange <開始日> <終了日>
```

開始日、終了日の文字列の形式は、[dayjsに依存していてISO 8601形式ですが](https://day.js.org/docs/en/parse/string)、解説のわかりやすさの観点から、Moment.jsのドキュメントを参照してください。

[Moment.js | Docs](https://momentjs.com/docs/#/parsing/string/)

``` plain
$ detective_connan_story_info_getter dateRange 20180721 20181103
1,名探偵コナン第908話,川床に流れた友情,2018/7/21
2,名探偵コナン第909話,燃えるテントの怪（前編）,2018/7/28
3,名探偵コナン第910話,燃えるテントの怪（後編）,2018/8/4
4,名探偵コナン第57話,ホームズ・フリーク殺人事件（前編）（デジタルリマスター）,2018/8/11
5,名探偵コナン第58話,ホームズ・フリーク殺人事件（後編）（デジタルリマスター）,2018/8/18
6,名探偵コナン第911話,目暮警部からの依頼,2018/9/1
7,名探偵コナン第912話,モデルになった探偵団,2018/9/8
8,名探偵コナン第913話,連れ去られたコナン（前編）,2018/9/15
9,名探偵コナン第914話,連れ去られたコナン（後編）,2018/9/22
10,名探偵コナン第915話,JK探偵鈴木園子,2018/9/29
11,名探偵コナン第916話,恋と推理の剣道大会（前編）,2018/10/6
12,名探偵コナン第917話,恋と推理の剣道大会（後編）,2018/10/13
13,名探偵コナン第75話,金融会社社長殺人事件（デジタルリマスター）,2018/10/20
14,名探偵コナン第918話,ミニパトポリス大追跡,2018/10/27
15,名探偵コナン第919話,JKトリオ秘密のカフェ（前編）,2018/11/3
```

## 放送日で検索

```sh
detective_connan_story_info_getter date <放送日>
```

放送日の文字列の形式は、[dayjsに依存していてISO 8601形式ですが](https://day.js.org/docs/en/parse/string)、解説のわかりやすさの観点から、Moment.jsのドキュメントを参照してください。

[Moment.js | Docs](https://momentjs.com/docs/#/parsing/string/)

```plain
$ detective_connan_story_info_getter date 20180721
1,名探偵コナン第908話,川床に流れた友情,2018/7/21
```

## キーワードで検索

```sh
detective_connan_story_info_getter title <部分一致文字列>
```

アニメの各話のタイトルに対して部分一致検索をし、該当する放送すべてを列挙します。

```plain
$ detective_connan_story_info_getter title ホームズ
1,名探偵コナン第57話,ホームズ・フリーク殺人事件（前編）,1997/5/5
2,名探偵コナン第58話,ホームズ・フリーク殺人事件（後編）,1997/5/12
3,名探偵コナン第616話,ホームズの黙示録（名探偵の弟子）,2011/5/21
4,名探偵コナン第617話,ホームズの黙示録（LOVE　is　０）,2011/5/28
5,名探偵コナン第618話,ホームズの黙示録（サタン）,2011/6/4
6,名探偵コナン第619話,ホームズの黙示録（Code　break）,2011/6/11
7,名探偵コナン第620話,ホームズの黙示録（芝の女王）,2011/6/18
8,名探偵コナン第621話,ホームズの黙示録（０　is　Start）,2011/6/25
9,名探偵コナン第57話,ホームズ・フリーク殺人事件（前編）（デジタルリマスター）,2018/8/11
10,名探偵コナン第58話,ホームズ・フリーク殺人事件（後編）（デジタルリマスター）,2018/8/18
```

## 放送話番号で検索

```sh
detective_connan_story_info_getter storyNum <放送話番号>
```

放送話番号は正の整数のみで入力してください。

ytv(読売テレビ)の元データは特に再放送のものについてしばしば間違っており、手動で補正しています。補正漏れを見つけた場合はIssueに報告してください。

```plain
$detective_connan_story_info_getter storyNum 78
1,名探偵コナン第58話,ホームズ・フリーク殺人事件（後編）,1997/5/12
2,名探偵コナン第58話,ホームズ・フリーク殺人事件（後編）（デジタルリマスター）,2018/8/18
```
