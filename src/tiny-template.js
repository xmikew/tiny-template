function TinyTemplate(template, json_fields) {
    this.function_prefix = "script:";
    this.template = template;
    this.registry = {};

    if (json_fields === undefined) {
        this.json_fields = [];
    } else {
        this.json_fields = json_fields;
    }
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

TinyTemplate.prototype.render_if_json = function(key, data) {
    if (this.json_fields.indexOf(key) >= 0 && typeof(data[key] === "string")) {
        return {[key]: JSON.parse(data[key])};
    } else {
        return data;
    }
}

TinyTemplate.prototype.interpolate = function(expr, name, data) {
    var self = this;
    var res = name.split('.').reduce(function(obj, key) {
        var regex = /^\s*([\p{L}0-9_-]+)\[\s*(\d+)\s*\]\s*$/ui;
        if ( (match = regex.exec(key)) !== null) {
            // array matching
            var key = match[1];
            var index = match[2];
            obj = self.render_if_json(key, obj)
            return obj && obj[key] && obj[key][index];
        }
        obj = self.render_if_json(key, obj)
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
