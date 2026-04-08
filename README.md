# Tiny Template

A tiny templating engine.

## Design Principles

I needed a small templating engine with following criteria:

- Small - copy and pasteable
- Runs on ES5
- No dependencies (except dev deps, testing)

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

If a listed field is not a primitive string but stringifies to JSON (e.g. some application wrappers), pass a third argument `true`: `new TinyTemplate(template, json_fields, true)`.

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

* Array of Dict lookups (array of objects with the **same** fields, e.g. `key_name` + `value`)
```
var tinyTemplate = new TinyTemplate("${user.attributes[key_name=department].value}");
var data = { user: { name: "Bob", attributes: [{ key_name: "department", value: "finance" }, { key_name: "title", value: "cro" }] } };
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
var tinyTemplate = new TinyTemplate(template);
tinyTemplate.render(data);
// User: Alice | Role: Admin
```

See test/template.js for more example usages

## API

### High-level (template instance)

Typical ServiceNow or app code uses the **instance** only:

| Method / property | Purpose | Example |
|-------------------|---------|---------|
| `new TinyTemplate(templateString, jsonFieldNames?, coerceJsonFields?)` | Build an engine for one template. Optional `jsonFieldNames` lists property names (dotted path segments) whose values are **JSON strings** to parse when resolving paths; if the value is already an array or plain object, it is left as-is. If `coerceJsonFields === true`, non-string values for listed keys are run through `String(value)` and then `JSON.parse` when that produces valid JSON (for hosts where the field is not a primitive string). Default is `false`. | `// strict string JSON only`<br>`new TinyTemplate(tpl, ['u_source_data'])`<br>`// allow String(coerced)`<br>`new TinyTemplate(tpl, ['u_source_data'], true)` |
| `render(data, validate?)` | Substitute `${…}` in the template using `data`. If `validate === true`, throws when any placeholder cannot be resolved. | `// data = { user: { name: 'Bob' } }`<br>`t.render(data)` |
| `register_script(name, fn)` | Register `${script:name}` / `${script:name(a, b)}` handlers. | `// data = { ticket: 'INC001' }` (template uses `${script:ticket}`)<br>`t.register_script('ticket', function (d) { return d.ticket; })` |
| `alias(shortName, dottedPath)` | Map `${alias:shortName}` segments to a longer path. | `// data = { user: { emails: ['a@b.com'] } }` (template uses `${alias:primary}`)<br>`t.alias('primary', 'user.emails[0]')` |
| `interpolate_failure_as_blank` | If `true` (default), unresolved placeholders become empty text; if `false`, the `${…}` token is preserved in the output. | `// data = {}`, template has `${user.missing}`<br>`t.interpolate_failure_as_blank = false` |
| `last_errors` | After `render` without `validate`, holds messages for placeholders that failed. | `// after render with unresolved placeholders`<br>`t.last_errors` |
| `get_error_str(errs?)` | Format error list for logging or throwing. If `errs` is omitted or `null`/`undefined`, uses `last_errors` from the most recent `render`. | `t.render(data);`<br>`t.get_error_str()` or `t.get_error_str(t.last_errors)` |

Conditionals (`${if …}${else}${endif}`), null coalesce (`??`), literals in `${…}`, and path syntax are all handled inside `render`.

### Low-level (static path helpers)

Same path rules as `${path}` inside a template, for resolving paths against data without going through `render`.

| Static | Purpose | Example |
|--------|---------|---------|
| `TinyTemplate.resolve_path(root, pathString, jsonFieldNames?, coerceJsonFields?)` | Walk one dotted/bracket path from `root` and return the value. `jsonFieldNames` / `coerceJsonFields` match the second and third constructor arguments when resolving listed JSON fields. | `// data = { user: { name: 'Bob' } }`<br>`TinyTemplate.resolve_path(data, 'user.name', [])` → `'Bob'` |
| `TinyTemplate.render_if_json(key, obj, jsonFieldNames, coerceJsonFields?)` | If `key` is listed: parse when `obj[key]` is a string; if `coerceJsonFields` is true, also try `JSON.parse(String(obj[key]))`; if already an array or plain object (after failed coerce), return `obj`. Instance passes `this.coerce_json_fields`. | `// obj = { items: '[1,2]' }`, key `items` is listed<br>`TinyTemplate.render_if_json('items', obj, ['items'])` |

`resolve_path` is the supported entry point for path resolution outside `render`. Other helpers exist on the constructor for implementation (`resolve_segment`, `tokenize_path`); **do not rely on them** from app code—they may change when the parser or walk strategy changes.

Path strings for `resolve_path` should match what you would put inside `${…}` **after** any `alias:` expansion you apply yourself.

## Contributing

Adhere to design principles, open a pr, write a test

## License

Apache 2.0
