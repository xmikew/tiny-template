var tinyTemplate = Class.create();

tinyTemplate.prototype = {
    initialize: function(template, json_fields) {
        this.function_prefix = "script:";
        this.alias_prefix = "alias:";
        this.template = template;
        this.interpolate_failure_as_blank = true;
        this.last_errors = [];
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
            var dict_regex = /^\s*([a-zA-Z0-9]+)\s*\[\s*["']?\s*([a-zA-Z0-9_-]+)\s*['"]?\s*=\s*['"]?\s*([a-zA-Z0-9_-]+)\s*['"]?\s*\]\s*$/i;
            var exists_regex = /^\s*([a-zA-Z0-9]+)\s*\[\s*["']?\s*key\s*['"]?\s*=\s*['"]?\s*([a-zA-Z0-9_-]+)\s*['"]?\s*\?\s*\](\[\s*(\d+)\s*\]\s*)?\s*$/i;
            //var exists_regex = /^([a-zA-Z0-9]+)\[key=([a-zA-Z0-9_-]+)\?\]$/i;
            if ((match = arr_regex.exec(key)) !== null) {
                // array matching

                var key_name = match[1];
                var index = match[2];
                obj = self.render_if_json(key_name, obj);
                return obj && obj[key_name] && obj[key_name][index];
            }
            else if ((match = dict_regex.exec(key)) !== null) {
            // dict lookup matching

                var key_name = match[1];
                var index_name = match[2];
                var index_match_val = match[3];
                try {
                    var search_array = obj[key_name];
                    for (var i = 0; i < search_array.length; i++) {
                        if (search_array[i][index_name] == index_match_val) {
                            return search_array[i];
                        }
                    }
                } catch (e) {
                    return "";
                }
            }
            else if ((match = exists_regex.exec(key)) !== null) {
                var obj_name = match[1];
                var key_search = match[2];
                var array_index = match[4];
                try {
                    var search_arr = obj[obj_name];
                    for (var j = 0; j < search_arr.length; j++) {
                        if (search_arr[j].hasOwnProperty(key_search)) {
                            if (array_index !== undefined) {
                                return search_arr[j][key_search][parseInt(array_index, 10)];
                            } else {
                                return search_arr[j][key_search];
                            }
                        }
                    }
                } catch (e) {
                    return "";
                }
            }
            obj = self.render_if_json(key, obj);
            return obj && obj[key];
        }, data);
        return res;
    },

    validate: function(errs) {
        err = this.get_error_str(errs);
        if (err) {
            throw new Error(err);
        }
        return true;
    },

    get_error_str: function(errs) {
        var err = "";
        if (errs.length > 0) {
            err = "validate: Failed to replace all template variables. Got " + errs.length + " errors:\n";
            err += errs.join("\n");
        }
        return err;
    },

    // New Methods 
    evaluateCondition: function(condition, data) {
        var val = this.interpolate("", this.expand_aliases(condition.trim()), data);
        return !!val;
    },
    processConditionals: function(template, data) {
        var self = this;
        //regex
        var conditionalRe = /\$\{\s*if\s+([^}]+)\s*\}([\s\S]*?)(?:\$\{\s*else\s*\}([\s\S]*?))?\$\{\s*endif\s*\}/g;
        return template.replace(conditionalRe, function(match, condition, truePart, falsePart) {
            if (self.evaluateCondition(condition, data)) {
                return truePart;
            } else {
                return falsePart || "";
            }
        });
    },

    // End New Method 
    render: function(data, validate) {
        var self = this;
        this.template = this.processConditionals(this.template, data);

        var identifier_regex = /(\s*[^\\](\$\{\s*([^}]+)\s*\})\s*)/i;
        var string_regex = /^\s*(["'])((?:\\.|[^\\])*?)\1\s*$/;

        self.last_errors = [];
        var errs = [];
        while ((match = identifier_regex.exec(this.template)) !== null) {
            var expr = match[2];
            var name = match[3].trim();
            this.template = this.template.replace(expr, function(match) {
                var names = name.split(/\s*\?\?\s*/);
                for (var i = 0; i < names.length; i++) {
                    var name_id = names[i];
                    if ((match = name_id.match(string_regex))) {
                        return match[2];
                    }

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
                // prevents infinite loop with keeping ${var} in the template
                // regex won't process vars that are escaped with \ (i.e. \${my_var})
                return self.interpolate_failure_as_blank ? "" : "\\" + expr;
            });
        }

        self.last_errors = errs;
        if (validate) {
            self.validate(errs);
        }

        return this.template.replace("\\$", "$");
    },

    type: 'tinyTemplate'
};

module.exports = tinyTemplate;
