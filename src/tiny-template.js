function TinyTemplate(template) {
    this.function_prefix = "script:";
    this.template = template;
    this.registry = {};
}

TinyTemplate.prototype.register_script = function(name, f) {
    this.registry[name] = f;
}

TinyTemplate.prototype.get_script = function(name) {
    if (name.startsWith(this.function_prefix)) {
        var name_no_prefix = name.replace(this.function_prefix, "");
        if (this.registry.hasOwnProperty(name_no_prefix)) {
            return this.registry[name_no_prefix];
        }
    }
    return undefined;
}

TinyTemplate.prototype.interpolate = function(expr, name, data) {
    var res = name.split('.').reduce(function(obj, key) {
        return obj && obj[key];
    }, data);
    return res;
}

TinyTemplate.prototype.render = function(data) {
    var self = this;

    var regex = /([ ]*(\$\{\s*([^}]+)\s*\})\s*)/i;
    while (( match = regex.exec(this.template)) !== null) {
        var expr = match[2];
        var name = match[3].trim();
        this.template = this.template.replace(expr, function(match) {
            var f = self.get_script(name);
            if (f) {
                return f(expr, name, data);
            } else {
                return self.interpolate(expr, name, data);
            }
        });
    }
    return this.template;
}

module.exports = TinyTemplate;
