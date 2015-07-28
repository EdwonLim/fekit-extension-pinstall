var fs = require('fs'),
    sysPath = require('path'),
    cpr = require('cpr'),
    ignore = require('ignore'),
    execSync = require('child_process').execSync;

exports.usage = '通过git安装fekit module';

exports.set_options = function(optimist) {
    return optimist;
};

exports.run = function(options) {
    var localPath = options['_'][1] ? options['_'][1][0] == '/' ? options['_'][1] : sysPath.join(options.cwd, options['_'][1]) : '',
        fekitModulePath = sysPath.join(options.cwd, 'fekit_modules'),
        proFekitConfig,
        modFekitConfig,
        moduleName,
        moduleVersion,
        modulePath,
        ig;

    if (!fs.existsSync(fekitModulePath)) {
        fs.mkdirSync(fekitModulePath);
    }

    // 获取模块信息
    try {
        modFekitConfig = JSON.parse(fs.readFileSync(sysPath.join(localPath, 'fekit.config')));
    } catch(e) {
        rmTmp();
        throw new Error('模块 fekit.config 解析失败！');
    }

    moduleName = modFekitConfig.name;
    moduleVersion = modFekitConfig.version;
    modulePath = sysPath.join(fekitModulePath, moduleName);
    // 添加配置信息
    modFekitConfig.source = {
        path: localPath
    };

    // 更改项目依赖配置
    try {
        proFekitConfig = JSON.parse(fs.readFileSync(sysPath.join(options.cwd, 'fekit.config'), 'UTF-8'));
    } catch(e) {
        throw new Error('项目 fekit.config 解析失败！');
    }

    proFekitConfig.dependencies = proFekitConfig.dependencies || {};
    proFekitConfig.dependencies[moduleName] = moduleVersion;
    fs.writeFileSync(sysPath.join(options.cwd, 'fekit.config'), JSON.stringify(proFekitConfig, null, 4), 'UTF-8');

    // 拷贝目录
    ig = ignore().addIgnoreFile(sysPath.join(localPath, '.fekitignore'));

    cpr(localPath, modulePath, {
        deleteFirst: true,
        overwrite: true,
        confirm: false,
        filter: function(path) {
            var pPath = sysPath.relative(localPath, path);
            if (pPath.indexOf('.') === 0) {
                return false;
            } else if (!ig.filter([pPath]).length) {
                return false;
            }
            return true;
        }
    }, function(err) {
        if (err) {
            throw err;
        } else {
            fs.writeFileSync(sysPath.join(modulePath, 'fekit.config'), JSON.stringify(modFekitConfig, null, 4), false);

            execSync('fekit install', {
                cwd: modulePath
            });
            console.log('****** 安装 ' + moduleName + '@' + moduleVersion + ' 成功！******');
        }

    });

};

