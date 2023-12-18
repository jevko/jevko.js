import test from 'node:test'
import assert from 'assert/strict'

import { parseDmń } from "../dmń.js";

const testdata1 = `
last modified 1 April 2001 by John Doe
.first name[John]
.last name[Smith]
.is alive[#bool[true]]
.age[#u64[27]]
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
.children[#seq[]]
.spouse[#nil[]]

.spouse2[#json[null]]
.children2[#json[\`'[]'\`]]
.is alive2[#json[true]]
.age2[#json[27]]
`

// todo
;`
#shashift[
  .version[1]
  #import[.from[std] [u64][seq][bool]]
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
  .b[#num[2]]
  .c[#bool[true]#bool[false]]
  #sub[]
]`

const td3 = `#bool[true]`

const td4 = `#html[
  #head[
    #title[This is a title]
  ]
  #body[
    #div[
      #p[Hello world!]
      #abbr[
        .id[anId]
        .class[jargon]
        .style[color: purple;]
        .title[Hypertext Markup Language]
      HTML]
      #a[.href[https://www.wikipedia.org/]
        A link to Wikipedia!
      ]
      #p[
        Oh well, 
        #span[.lang[fr]c'est la vie],
        as they say in France.
      ]
    ]
  ]
]`

test(`dmń 1`, () => {
  const pd = parseDmń(testdata1)

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
  const pd = parseDmń(testdata2)

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
  const pd = parseDmń(td3)

  assert.deepEqual(pd, true)
})
test(`dmń 3`, () => {
  const pd = parseDmń(td4)

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