//Encoding: UTF-8
var assert = require('assert');

global.Class = {
    create: function() {
        return function() {
            this.initialize & this.initialize.apply(this, arguments);
        };
    }
};

var TinyTemplate = require('../src/tiny-template.js');

describe('TinyTemplate', function() {
    it('should interpolate variables correctly', function() {
        var template = "Hello, ${name}! You are ${age} years old.";
        var data = { name: "Alice", age: 30 };
        var expected = "Hello, Alice! You are 30 years old.";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should handle nested object interpolation', function() {
        var template = "My details are: Name - ${ user.name   }, Age - ${ user.age}, City - ${user.address.city}";
        var data = { user: { name: "Bob", age: 25, address: { city: "New York" } } };
        var expected = "My details are: Name - Bob, Age - 25, City - New York";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should interpolate arrays correctly', function() {
        var template = "Hello, ${name}! You are ${age} years old and you like to ${hobbies[0]}";
        var data = { name: "Alice", age: 30, hobbies: ["read", "hike"] };
        var expected = "Hello, Alice! You are 30 years old and you like to read";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should handle nested object interpolation', function() {
        var template = "My details are: Name - ${ user.name   }, Age - ${ user.age}, City - ${user.address.city}";
        var data = { user: { name: "Bob", age: 25, address: { city: "New York" } } };
        var expected = "My details are: Name - Bob, Age - 25, City - New York";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should handle nested object and array interpolation', function() {
        var template = "My details are: Name - ${user.name}, Age - ${user.age}, Child - ${user.children[0].name}";
        var data = { user: { name: "Bob", age: 25, children: [{ name: "Susan", age: 10}, {name: "Bobby", age: 10}] }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should handle nested object and array interpolation and unicode', function() {
        var template = "My details are: Name - ${user.𝖓𝖆𝖒𝖊}, Age - ${user.age}, Child - ${user.children[0].name}";
        var data = { user: { 𝖓𝖆𝖒𝖊: "𝐁𝐨𝐛", age: 25, children: [{ name: "𝕾𝖚𝖘𝖆𝖓", age: 10}, {name: "Bobby", age: 10}] }};
        var expected = "My details are: Name - 𝐁𝐨𝐛, Age - 25, Child - 𝕾𝖚𝖘𝖆𝖓";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should allow for custom function to be registered', function() {
        var template = "My details are: Name - ${ user.name }, ${script:test}";
        var data = { user: { name: "Bob", age: 25, address: { city: "New York" } } };
        var expected = "My details are: Name - Bob, <this is the custom part>";
        var tinyTemplate = new TinyTemplate(template);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>";});
        var result = tinyTemplate.render(data);
        assert.strictEqual(result, expected);
    });

    it('should allow for decoding json fields', function() {
        var template = "My details are: Name - ${user.name}, Age - ${user.age}, Child - ${user.children[0].name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should allow aliases to be used', function() {
        var template = "My details are: Name - ${user.name}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should allow aliases to be used error', function() {
        var template = "My details are: Name - ${user.name}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - ";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[3].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should support null coalesce operation', function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });


    it('should support null coalesce operation with existing key', function() {
        var template = "My details are: Name - ${user.empty_attr ?? 'test \' test'}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", empty_attr: "", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - test ' test, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should all work together', function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.age}, Child - ${user.children[3] ?? alias:first_child_name}, custom - ${script:test}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan, custom - <this is the custom part>";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>";});
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should not fail if validate false', function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.ag}, Child - ${user.children[3] ?? alias:first_child_name}, custom - ${script:test}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - , Child - Susan, custom - <this is the custom part>";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>";});
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should throw error if you attempt to register non-function', function() {
        var tinyTemplate = new TinyTemplate("test data");
        assert.throws(
            function() {
                tinyTemplate.register_script('does_not_exist', undefined);
            },
            Error
        );
    });

    it("should throw error if validate is set and a var doesn't interpolate", function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.age}, Child - ${user.children[3] ?? alias:first_child_name}, custom - ${script:test}";
        var data = { user: { name: "Bob", ag: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan, custom - <this is the custom part>";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>";});
        tinyTemplate.alias('first_child_name', 'user.children[0].name');
        assert.throws(function() {
                tinyTemplate.render(data, true);
            },
            Error
        );
     });

    it("should replace interpolate_failure if it does not interpolate", function() {
        var template = "My details are: Name - ${user.name}";
        var expected = "My details are: Name - ${user.name}";
        var data = { user: { no_name: "Bob" } };

        var tinyTemplate = new TinyTemplate(template);
        tinyTemplate.interpolate_failure_as_blank = false;
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);

     });

    it("should return proper error string upon failure", function() {
        var template = "My details are: Name - ${user.name}";
        var data = { user: { no_name: "Bob" } };
        var expected = "My details are: Name - ";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
        var err = tinyTemplate.get_error_str(tinyTemplate.last_errors);
        var expected_error = "validate: Failed to replace all template variables. Got 1 errors:\nFailed to replace var ${user.name} in template";

        assert.strictEqual(err, expected_error);

    });


    it("should allow search of array of objects", function() {
        var template = "My details are: Name - ${user.name}, job is ${user.attributes[key=job].value}";
        var data = { user: { name: "Bob", attributes: [{key: "job", value: "devops"}, {key: "level", value: "i8"}] } };
        var expected = "My details are: Name - Bob, job is devops";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it("should handle not error of array of objects when not array", function() {
        var template = "My details are: Name - ${user.name}, job is ${user.attributes[key=job].value}";
        var data = { user: { name: "Bob", attributes: {key: "job"} } };
        var expected = "My details are: Name - Bob, job is ";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });


    it("should handle key exists operator in dict lookup and array", function() {
        var template = "My details are: Name - ${user.name}, first reference: ${user.attributes[key=references?][0]}";
        var data = { user: { name: "Bob", attributes: [{key: "job", value: "devops"}, {references: [1,2,3]}] } };
        var expected = "My details are: Name - Bob, first reference: 1";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });


    it("should handle key exists operator in dict lookup and dict", function() {
        var template = "My details are: Name - ${user.name}, first reference: ${user.attributes[key=references?].name}";
        var data = { user: { name: "Bob", attributes: [{key: "job", value: "devops"}, {references: {name: "john"} }] } };
        var expected = "My details are: Name - Bob, first reference: john";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });


    it("should not confuse key=val? with key=val", function() {
        var template = "My details are: Name - ${user.name}, first reference: ${user.attributes[key=references].value[0]}";
        var data = { user: { name: "Bob", attributes: [{key: "job", value: "devops"}, {key: "references", value: [1,2,3]}] } };
        var expected = "My details are: Name - Bob, first reference: 1";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });


    it("should allow parameters into functions", function() {
        var template = "My details are: Name - ${script:get(blah) ?? script:get(user, name)}";
        var data = { user: { name: "Bob", attributes: [{key: "job", value: "devops"}, {key: "references", value: [1,2,3]}] } };
        var expected = "My details are: Name - Bob";

        var tinyTemplate = new TinyTemplate(template);
        tinyTemplate.register_script('get', function(data, expr, nameid, params) {
            return params.reduce(function(data, param) {
                return data && data[param];
            }, data);
        });
        var result = tinyTemplate.render(data);
        assert.strictEqual(result, expected);
    });
 });
