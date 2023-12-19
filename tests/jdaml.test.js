import test from 'node:test'
import assert from 'assert/strict'

import { highlightJdaml, parseJdaml, parseJdamlMarkup } from "../jdaml.js";

const testdata1 = `
last modified 1 April 2001 by John Doe
.first name[John]
.last name[Smith]
.is alive[  'bool[true]  ]
.age['u64[27]]
.address[
  .street address[21 2nd Street]
  .city[New York]
  .state[NY]
  .postal code[10021-3100]
]
any number of phone numbers can be entered
.phone numbers[
  [
    .type[home]
    .number[212 555-1234]
  ]
  [
    .type[office]
    .number[646 555-4567]
  ]
]
.children['seq[]]
.spouse['nil[]]

.spouse2['json[null]]
.children2['json[\`'[]'\`]]
.is alive2['json[true]]
.age2['json[27]]
`

;`
.children[[['seq[]]]]

.children[.type[seq]]
.spouse[.type[nil]]
.age2[27.type[json]]

.children[.as[seq]]
.spouse[.as[nil]]
.age2[27.as[json]]
`

// todo
;`
'shashift[
  .version[1]
  'import[.from[std] [u64][seq][bool]]
]

{
  from: 'std',
  __: ['u64', 'seq', 'bool']
}
`

const testdata2 = `
comment.yarr[odd[1][2][3][4]]
.yarl[
  ._oof[foo]
  .a[[x][y]]
  .b['num[2]]
  .c['bool[true]'bool[false]]
]`

const td3 = `'bool[true]`

const td4 = `'html[
  'head[
    'title[This is a title]
  ]
  'body[
    'div[
      'p[Hello world!]
      'abbr[
        .id[anId]
        .class[jargon]
        .style[color: purple;]
        .title[Hypertext Markup Language]
      HTML]
      'a[.href[https://www.wikipedia.org/]
        A link to Wikipedia!
      ]
      'p[
        Oh well, 
        'span[.lang[fr]c'est la vie],
        as they say in France.
      ]
    ]
  ]
]`

const doctest = `'doctest[


yada yada

'test setup[
  .group[*]
  .skip if[pd is None]
  .code[\`'
    data = pd.Series([42])
  '\`]
]

yada yada

'doc test[
  .skip if[pd is None]
  .py version[> 3.10]
  .code[\`'
    >>> data.iloc[0]
    42
  '\`]
]

yada yada

'test code[
  .skip if[pd is None]
  .code[\`'
    print(data.iloc[-1])
  '\`]
]

yada yada

'test output[
  .skip if[pd is None]
  .hide[]
  .options[-ELLIPSIS, +NORMALIZE_WHITESPACE]
  .code[\`'
    42
  '\`]
]

yada yada


]`

test(`dmń 1`, () => {
  const pd = parseJdaml(testdata1)

  assert.deepEqual(pd, {
    "first name": "John",
    "last name": "Smith",
    "is alive": true,
    "age": 27,
    "address": {
      "street address": "21 2nd Street",
      "city": "New York",
      "state": "NY",
      "postal code": "10021-3100"
    },
    "phone numbers": [
      {
        "type": "home",
        "number": "212 555-1234"
      },
      {
        "type": "office",
        "number": "646 555-4567"
      }
    ],
    "children": [],
    "spouse": null,
    "spouse2": null,
    "children2": [],
    "is alive2": true,
    "age2": 27
  })
})


test(`dmń 2`, () => {
  const pd = parseJdaml(testdata2)

  // check that non-attr subs are disallowed in map/object-like trees
  assert.throws(() => parseJdaml(testdata2 + `'sub[]`))

  assert.deepEqual(pd, {
    "yarr": [
      "1",
      "2",
      "3",
      "4"
    ],
    "yarl": {
      "_oof": "foo",
      "a": [
        "x",
        "y"
      ],
      "b": {
        "_tag": "num",
        "_subs": [
          "2"
        ]
      },
      "c": [
        true,
        false
      ]
    }
  })
})
test(`dmń 3`, () => {
  const pd = parseJdaml(td3)

  assert.deepEqual(pd, true)
})
test(`dmń 3`, () => {
  const pd = parseJdaml(td4)

  // console.log(JSON.stringify(pd, null, 2))

  assert.deepEqual(pd, {
    "_tag": "html",
    "_subs": [
      "\n  ",
      {
        "_tag": "head",
        "_subs": [
          "\n    ",
          {
            "_tag": "title",
            "_subs": [
              "This is a title"
            ]
          },
          "\n  "
        ]
      },
      "\n  ",
      {
        "_tag": "body",
        "_subs": [
          "\n    ",
          {
            "_tag": "div",
            "_subs": [
              "\n      ",
              {
                "_tag": "p",
                "_subs": [
                  "Hello world!"
                ]
              },
              "\n      ",
              {
                "_tag": "abbr",
                "id": {
                  "_tag": "",
                  "_subs": [
                    "anId"
                  ]
                },
                "class": {
                  "_tag": "",
                  "_subs": [
                    "jargon"
                  ]
                },
                "style": {
                  "_tag": "",
                  "_subs": [
                    "color: purple;"
                  ]
                },
                "title": {
                  "_tag": "",
                  "_subs": [
                    "Hypertext Markup Language"
                  ]
                },
                "_subs": [
                  "\n        ",
                  "\n        ",
                  "\n        ",
                  "\n        ",
                  "\n      HTML"
                ]
              },
              "\n      ",
              {
                "_tag": "a",
                "href": {
                  "_tag": "",
                  "_subs": [
                    "https://www.wikipedia.org/"
                  ]
                },
                "_subs": [
                  "\n        A link to Wikipedia!\n      "
                ]
              },
              "\n      ",
              {
                "_tag": "p",
                "_subs": [
                  "\n        Oh well, \n        ",
                  {
                    "_tag": "span",
                    "lang": {
                      "_tag": "",
                      "_subs": [
                        "fr"
                      ]
                    },
                    "_subs": [
                      "c'est la vie"
                    ]
                  },
                  ",\n        as they say in France.\n      "
                ]
              },
              "\n    "
            ]
          },
          "\n  "
        ]
      },
      "\n"
    ]
  })
})
test(`dmń doctest`, () => {
  const pd = parseJdaml(doctest)

  console.log(JSON.stringify(pd, null, 2))

  // todo
  // assert.deepEqual(pd, true)
})


const hlme = `
.first name[John]
.last name[Smith]
.is alive['[true]]
.age['[27]]
.address[
  .street address[21 2nd Street]
  .city[New York]
  .state[NY]
  .postal code[10021-3100]
]
.phone numbers[
  [
    .type[home]
    .number[212 555-1234]
  ]
  [
    .type[office]
    .number[646 555-4567]
  ]
]
.children['[seq]]
.spouse['[nil]]


last modified 1 April 2001 by John Doe
.owner[
  .name[John Doe]
  .organization[Acme Widgets Inc.]
]
.database[
  use IP if name resolution is not working
  .server[192.0.2.62]
  .port['[143]]
  .file[payroll.dat]
  .select columns[
    [name]
    [address]
    [phone number]
  ]
]


'html[
  'head[
    'title[This is a title]
  ]
  'body[
    'div[
      'p[Hello world!]
      'abbr[
        .id[anId]
        .class[jargon]
        .style[color: purple;]
        .title[Hypertext Markup Language]
      HTML]
      'a[.href[https://www.wikipedia.org/]
        A link to Wikipedia!
      ]
      'p[
        Oh well, 
        'span[.lang[fr]c'est la vie],
        as they say in France.
      ]
    ]
  ]
]`

test(`dmń doctest highlight`, () => {
  // const pd = highlightÐmń(doctest)
  const pd = highlightJdaml(hlme)

  console.log(`<pre>${pd}</pre>`)

  // assert.deepEqual(pd, true)
})

const heaven = `.server_config[
  .port_mapping[
    Expose only ssh and http to the public internet.
    [22:22]
    [80:80]
    [443:443]
  ]
  .serve[
    [/robots.txt]
    [/favicon.ico]
    [*.html]
    [*.png]
    [!.git]  Do not expose our Git repository to the entire world.
  ]
  .geoblock_regions[
    The legal team has not approved distribution in the Nordics yet.
    [dk]
    [fi]
    [is]
    [no]
    [se]
  ]
  .flush_cache[
    .on[ [push] [memory_pressure] ]
    .priority[background]
  ]
  .allow_postgres_versions[
    [9.5.25]
    [9.6.24]
    [10.23]
    [12.13]
  ]
]`

const datasquished = `.first name[John].last name[Smith].is alive['[true]].age['[27]].address[.street address[21 2nd Street].city[New York].state[NY].postal code[10021-3100]].phone numbers[[.type[home].number[212 555-1234]][.type[office].number[646 555-4567]]].children['[seq]].spouse['[nil]]`

const configquished = `last modified 1 April 2001 by John Doe.owner[.name[John Doe].organization[Acme Widgets Inc.]].database[use IP if name resolution is not working.server[192.0.2.62].port['[143]].file[payroll.dat].select columns[[name][address][phone number]]]`


const markupsquished = `'html['head['title[This is a title]]'body['div['p[Hello world!]'abbr[.id[anId].class[jargon].style[color: purple;].title[Hypertext Markup Language]HTML]'a[.href[https://www.wikipedia.org/]A link to Wikipedia!]'p[Oh well, 'span[.lang[fr]c'est la vie],as they say in France.]]]]`

const yamlsquished = `.server_config[.port_mapping[Expose only ssh and http to the public internet.'[22:22][80:80][443:443]].serve[[/robots.txt][/favicon.ico][*.html][*.png][!.git]Do not expose our Git repository to the entire world.].geoblock_regions[The legal team has not approved distribution in the Nordics yet.'[dk][fi][is][no][se]].flush_cache[.on[[push][memory_pressure]].priority[background]].allow_postgres_versions[[9.5.25][9.6.24][10.23][12.13]]]`

test(`JDAML squished highlight`, () => {
  // const pd = highlightÐmń(doctest)
  {
    const pd = highlightJdaml(doctest)
    console.log(pd)
  }
  // {
  //   const pd = highlightJdaml(datasquished)
  //   console.log(pd)
  // }
  // {
  //   const pd = highlightJdaml(configquished)
  //   console.log(pd)
  // }
  // {
  //   const pd = highlightJdaml(markupsquished)
  //   console.log(pd)
  // }
  // {
  //   const pd = highlightJdaml(yamlsquished)
  //   console.log(pd)
  // }

  // assert.deepEqual(pd, true)
})

test('parse', () => {
  const parse = parseJdaml

  assert.deepEqual(parse('abc'), 'abc')
  // assert.deepEqual(parse('[abc]'), ['abc'])
  assert.deepEqual(parse("'seq[[abc]]"), ['abc'])
  assert.deepEqual(parse('[abc][def]'), ['abc', 'def'])
  assert.deepEqual(parse("'seq[[abc][def]]"), ['abc', 'def'])
  assert.deepEqual(parse('.k1[abc] .k2[def]'), {k1: 'abc', k2: 'def'})
  assert.deepEqual(parse('.k1[abc] .k2[def] .;k3[xyz]'), {k1: 'abc', k2: 'def'})
  assert.deepEqual(parse('.k1[abc] .k2[def] .[;k3][xyz]'), {k1: 'abc', k2: 'def', ';k3': 'xyz'})
  assert.deepEqual(parse('.k1[abc] .k2[def] .[\\][xyz]'), {k1: 'abc', k2: 'def', '\\': 'xyz'})

  assert.deepEqual(parse('.k1``[v1]'), {'k1`': 'v1'})
  assert.deepEqual(parse('.k1[v1``]'), {k1: 'v1`'})
  assert.deepEqual(
    parse(`.abc[def]\`\`\`'.ghi'\`\`\`[\`[jkl\`]].mno\`\`[a\`\`b].xy[\`\`zw]lm`), 
    {abc: 'def', ghi: '[jkl]', 'mno`': 'a`b', xy: '`zw'},
  )

  assert.throws(() => parse('.k1`[v1]'))
  assert.throws(() => parse('.k1[v1`]'))
})

// test('stringify', () => {
//   assert.deepEqual(stringify('abc'), ('abc'))
//   assert.deepEqual(stringify(['abc']), ('[abc]'))
//   assert.deepEqual(stringify(['abc', 'def']), ('[abc][def]'))
//   assert.deepEqual(stringify({k1: 'abc', k2: 'def'}), ('k1[abc]k2[def]'))
//   assert.deepEqual(stringify({k1: 'abc', k2: 'def', '\\': 'xyz'}), ('k1[abc]k2[def]'[\\][xyz]'))

//   assert.deepEqual(
//     stringify({k1: '[abc]', k2: '`def`', '`[]`': 'xyz'}), 
//     ('k1[\\[[{]abc[}]]]k2[\\[[~]def[~]]]\\[[~][{][}][~]][xyz]')
//   )
// })