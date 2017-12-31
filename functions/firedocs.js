module.exports = class FireDocs {
  constructor(_config) {//config must be an object {}
    const config = _config;
    const regexBraces = /{{*[^{}]*}}/g;
    const imageRegex = /<img []*[^<]*\/?>/gi;
    const attrContentRegex = /("[^"]*")|('[^']*')/gi;//identifica palabras que estén entre comillas comunes o simples '' ""
    const whitespace = / /g;
    var lazyloadImagesSingle = function(a,customattrs) {
        //customattrs {class:'lazyload'} add custom attributes and if already exists, it concats the value (be careful with nested quotes)
        var attrValues = a.match(attrContentRegex)//lista de valores de atributos
        //remove text attributes
        for(var i = 0; i<attrValues.length;i++){//quotamos las comillas de los extemos. necesario?
        	a = a.replace(attrValues[i],'')
        }
        //quitar <img- y />
        a = a.substr(5,a.length).toLowerCase().replace('/>','').replace('>','').replace(whitespace,'')
        var attrKeys = a.split('=')
        var originalQuotes=[]
        attrKeys.pop()//delete the last element, always is blank
        var pos = attrKeys.indexOf('src')//change the src attribute if exists by the new attribute data-src for lazy-load
        if(pos!=-1){
            attrKeys[pos]='data-src'
        }
        for (var i = 0; i < attrValues.length; i++) {//delete the quotes in attrValues
            originalQuotes.push(attrValues[i][0])
            attrValues[i] = attrValues[i].substr(1,attrValues[i].length-2)
        }
        if(customattrs){//add the custom attributes if exists
            for (var attr in customattrs) {
                var pos = attrKeys.indexOf(attr.toLowerCase())
                if(pos!=-1){//concat if already exists
                    attrValues[pos] = attrValues[pos] + ' '+customattrs[attr]
                }else{//append if not exists yet
                    attrKeys.push(attr)
                    attrValues.push(customattrs[attr])
                    originalQuotes.push('"')
                }
            }
        }
        //rebuild the tag
        var output = '<img'
        for (var i = 0; i < attrKeys.length; i++) {
            output+=` ${attrKeys[i]}=${originalQuotes[i]}${attrValues[i]}${originalQuotes[i]}`
        }
        return output+'/>';
    }
    this.renderTemplate = function(filename,varsObj,res,configObj) {
        /*
        renders the variables {{varname}} of the file "filename" and returns in res.send()
        configObj:{headerFooter:true} if we have to add page header and footer to filename
        */
        if(!configObj)configObj={}
        var output='';
        var handleError = function(err) {
            res.send('Ocurrió un error. Reintente en breve.');
        }
        var render = function() {
            var varReplace = function(str){
                return varsObj[str.replace(whitespace,'').substr(2,str.length-4)]||'';
            }
            if(varsObj){
                output = output.replace(regexBraces,varReplace)
            }
            res.send(output)
            if(!varsObj)res.send(output)
        }
        var getFile = function(filename,next) {
            config.fs.readFile('./views/'+filename,function(err, templateData) {
                if(err)return handleError(err);
                output += templateData.toString()
                if(next)next()
            })
        }
        if(configObj.headerFooter){//si hay que incluirlos
            getFile('header.html',function(){
                getFile(filename,function() {
                    getFile('footer.html',render)
                })
            })
        }else{//without header and footer
            getFile(filename,render)
        }
    }
    this.lazyloadImages = function(article,imgattrs){
        var lazyfn = function(str) {
            return lazyloadImagesSingle(str,imgattrs)
        }
        return article.replace(imageRegex,lazyfn)
    }
  }
}
