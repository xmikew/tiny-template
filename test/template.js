var assert = require('assert');
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


    it('should allow for custom function to be registered', function() {
        var template = "My details are: Name - ${ user.name }, ${script:test}";
        var data = { user: { name: "Bob", age: 25, address: { city: "New York" } } };
        var expected = "My details are: Name - Bob, <this is the custom part>";
        var tinyTemplate = new TinyTemplate(template);
        tinyTemplate.register_script('test', function() { return "<this is the custom part>"});
        var result = tinyTemplate.render(data);
        assert.strictEqual(result, expected);

    });
});
