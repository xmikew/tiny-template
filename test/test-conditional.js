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

    // New Tests for Conditional Logic 
    it('should process conditional logic correctly (if without else, truthy)', function() {
        var template = "Status: ${if loggedIn}Welcome back!${endif}";
        var data = { loggedIn: true };
        var expected = "Status: Welcome back!";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should process conditional logic correctly (if without else, falsy)', function() {
        var template = "Status: ${if loggedIn}Welcome back!${endif}";
        var data = { loggedIn: false };
        var expected = "Status: ";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should process conditional logic correctly (if with else, truthy)', function() {
        var template = "Status: ${if loggedIn}Welcome back!${else}Please log in.${endif}";
        var data = { loggedIn: true };
        var expected = "Status: Welcome back!";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should process conditional logic correctly (if with else, falsy)', function() {
        var template = "Status: ${if loggedIn}Welcome back!${else}Please log in.${endif}";
        var data = { loggedIn: false };
        var expected = "Status: Please log in.";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

    it('should process multiple conditional blocks in one template correctly', function() {
        var template = "User: ${if user}${user}${else}Guest${endif} | Role: ${if role}${role}${else}Unknown${endif}";
        var data = { user: "Alice", role: "Admin" };
        var expected = "User: Alice | Role: Admin";

        var tinyTemplate = new TinyTemplate(template);
        var result = tinyTemplate.render(data);

        assert.strictEqual(result, expected);
    });

});
