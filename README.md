# Tiny Template

A tiny templating engine.

## Design Principles

I needed a small templating engine with following criteria:

- Small - copy and pasteable
- Runs on ES5
- No depedencies (except dev deps, testing)

Why? To use within Service-Now. I needed to be able to copy it quickly to a global include and also have no dependencies. Since Service-Now is often using a older js engine, I needed to be compatible with ES5.

## Usage
```
var template = "My name is: ${user.name}";
var data = { user: { name: "Bob" } };

var tinyTemplate = new TinyTemplate(template);
console.log(tinyTemplate.render(data));
// My name is: Bob
```

Supports following:

* Nested objects: ```${user.name}```
* Arrays: ```${user.name.children[0]}```
* Script definitions:

```
var template = "My custom script: ${script:custom}";
var tinyTemplate = new TinyTemplate(template);
tinyTemplate.register_script('custom', function(data, expr, name, params) {
    //data = data currently being rendered
    //expr = ${script:custom}
    //name = script:custom
    //params = array of params provided if set, e.g. ${script:custom(param1, param2)}

    return "some calculated thing from data";
});
tinyTemplate.render(...);
```
* Decoding of JSON Fields

```
var json_fields=['children'];
var tinyTemplate = new TinyTemplate("${children[0]}", json_fields);
// children will parsed into object
var data = {children: '[{"name": "Jane"}, {"name": "Bobby"}]'};
tinyTemplate.render(data);
```

* Aliases

```
var tinyTemplate = new TinyTemplate("${alias:short_name.key_value_finally}");
tinyTemplate.alias('short_name', 'some.very.long[0].references[0]')
var res = tinyTemplate.render({
    'some': {
        'very': {
            'long': [{
                'references': [{
                    'key_value_finally': 'woot',
                    'some_other_key': 'yipee'
                }],
            }],
        }
    }
});
// console.log(res); # woot
```

* Null coalesce
```
var tinyTemplate = new TinyTemplate("${user.full_name ?? user.name}");
var data = { user: { name: "Bob"} };
tinyTemplate.render(data);
// Bob
```

* Array of Dict lookups
```
var tinyTemplate = new TinyTemplate("${user.attributes[key=department].value}");
var data = { user: { name: "Bob", attributes:[ {key: "department", value: "finance"}, {key: "title", value: "cro"} ] } };
tinyTemplate.render(data);
// finance
```


* Array of Dict lookups with Exists operator
```
var tinyTemplate = new TinyTemplate("${user.attributes[key=references?][0].name}");
var data = { user: { name: "Bob", attributes:[ {key_name: "department", value: "finance"}, {references: [{name: "john"}] } ] } };
tinyTemplate.render(data);
// john
```

* Conditional Blocks
```
var template = "User: ${if user}${user}${else}Guest${endif} | Role: ${if role}${role}${else}Unknown${endif}";
var data = { user: "Alice", role: "Admin" };
template.render(data)
// User: Alice | Role: Admin
```

See test/template.js for more example usages

## Contributing

Adhere to design principles, open a pr, write a test

## License

Apache 2.0
