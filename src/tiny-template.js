var tinyTemplate = Class.create();

tinyTemplate.prototype = {
    initialize: function(template, json_fields) {
        this.function_prefix = "script:";
        this.alias_prefix = "alias:";
        this.template = template;
        this.registry = {};
        this.aliases = {};

        if (json_fields === undefined) {
            this.json_fields = [];
        } else {
            this.json_fields = json_fields;
        }
    },

    register_script: function(name, f) {
        if (typeof f !== 'function') {
            throw new Error("register_script: attempt to register non-function");
        }

        this.registry[name] = f;
    },

    get_script: function(name) {
        if (name.startsWith(this.function_prefix)) {
            var name_no_prefix = name.replace(this.function_prefix, "");
            if (this.registry.hasOwnProperty(name_no_prefix)) {
                return this.registry[name_no_prefix];
            }
        }
        return undefined;
    },

    alias: function(name, path) {
        this.aliases[name] = path;
    },

    get_alias: function(name) {
        if (name.startsWith(this.alias_prefix)) {
            var name_no_prefix = name.replace(this.alias_prefix, "");
            if (this.aliases.hasOwnProperty(name_no_prefix)) {
                return this.aliases[name_no_prefix];
            }
        }
        return undefined;
    },

    expand_aliases: function(name) {
        var self = this;
        var expanded = [];
        name.split('.').map(function(val) {
            var alias_key = self.get_alias(val);
            if (alias_key) {
                expanded.push(alias_key);
            } else {
                expanded.push(val);
            }
        });
        return expanded.join('.');
    },

    render_if_json: function(key, data) {
        if (this.json_fields.indexOf(key) >= 0 && typeof(data[key] === "string")) {
            var ret = {};
            ret[key] = JSON.parse(data[key]);
            return ret;
        } else {
            return data;
        }
    },

    interpolate: function(expr, name, data) {
        var self = this;
        var res = name.split('.').reduce(function(obj, key) {
            var arr_regex = /^\s*([a-zA-Z0-9_-]+)\[\s*(\d+)\s*\]\s*$/i;
            if ( (match = arr_regex.exec(key)) !== null) {
                // array matching
                var key_name = match[1];
                var index = match[2];
                obj = self.render_if_json(key_name, obj);
                return obj && obj[key_name] && obj[key_name][index];
            }
            obj = self.render_if_json(key, obj);
            return obj && obj[key];
        }, data);
        return res;
    },

    validate: function(errs) {
        if (errs.length > 0) {
            var err = "validate: Failed to replace all template variables. Got " + errs.length + " errors:\n";
            err += errs.join("\n");
            throw new Error(err);
        }
        return true;
    },

    render: function(data, validate) {
        var self = this;

        var identifier_regex = /(\s*(\$\{\s*([^}]+)\s*\})\s*)/i;
        var errs = [];
        while (( match = identifier_regex.exec(this.template)) !== null) {
            var expr = match[2];
            var name = match[3].trim();
            this.template = this.template.replace(expr, function(match) {
                var names = name.split(/\s*\?\?\s*/);
                for (var i=0; i<names.length; i++) {
                    var name_id = names[i];
                    var f = self.get_script(name_id);
                    if (f) {
                        var res_f = f(data, expr, name_id);
                        if (res_f) return res_f;
                    } else {
                        var res = self.interpolate(expr, self.expand_aliases(name_id), data);
                        if (res) return res;
                    }
                }
                errs.push("Failed to replace var " + expr + " in template");
                return "";
            });
        }

        if (validate) {
            self.validate(errs);
        }

        return this.template;
    },

    type: 'tinyTemplate'
};

module.exports = tinyTemplate;
