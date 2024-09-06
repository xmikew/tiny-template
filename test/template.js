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
        tinyTemplate.register_script('test', function() { return "<this is the custom part>"});
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
        tinyTemplate.alias('first_child_name', 'user.children[0].name')
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should allow aliases to be used error', function() {
        var template = "My details are: Name - ${user.name}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - ";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[3].name')
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should support null coalesce operation', function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.age}, Child - ${alias:first_child_name}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.alias('first_child_name', 'user.children[0].name')
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should all work together', function() {
        var template = "My details are: Name - ${user.name2 ?? user.name}, Age - ${user.age}, Child - ${user.children[3] ?? alias:first_child_name}, custom - ${script:test}";
        var data = { user: { name: "Bob", age: 25, children: '[{"name": "Susan", "age":10}, {"name": "Bobby", "age": 10}]' }};
        var expected = "My details are: Name - Bob, Age - 25, Child - Susan, custom - <this is the custom part>";

        var tinyTemplate = new TinyTemplate(template, ['children']);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>"});
        tinyTemplate.alias('first_child_name', 'user.children[0].name')
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
        tinyTemplate.register_script('test', function() { return "<this is the custom part>"});
        tinyTemplate.alias('first_child_name', 'user.children[0].name')
        assert.throws(function() {
                tinyTemplate.render(data, true);
            },
            Error
        );
     });
 });
