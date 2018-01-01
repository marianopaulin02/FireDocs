const functions  = require('firebase-functions'),
admin            = require('firebase-admin'),
express          = require('express'),
fs               = require('fs'),
fd               = require('./firedocs.js');

/////USER VARIABLES////////////////////////////////////
const
    DOCS_URI = '/ayuda',                      // start with '/' and not use '/' at the end
    COLLECTIONLIST = 'help',                  //collection name for the list of articles matadata
    COLLECTIONARTICLES = 'helparticles',      //collection name for the articles
    COLLECTIONSECTIONS = 'helpsections',      //collection name for the sections tree
    LAZYLOADIMAGES = true,                    //if you want rewrite <img/> to support lazyload
    ARTICLEDEFAULTIMAGEURL = '',              //absolute url. for social networks support. (blank to omit)
    IMG_ATTRS = {class:'lazyload'},           //add attributes to the article's <img/>
    FireDocs = new fd({
        fs:fs
    });


//END USER VARIABLES///////////////////////////////////
var firedocsApp = express();
var config = functions.config().firebase;
admin.initializeApp(config);
var firestore = admin.firestore();

firedocsApp.get(DOCS_URI, function (req, res) {///user/:id'  req.params.id
    return Promise.all([])
    .then(function(results){
        FireDocs.renderTemplate('home.html',{
            _articleTitle:'Ayuda',
            _articleDescription:'Encuentra artículos que te ayudarán a resolver los problemas más comunes y descubrir funcionalidades.',
            //METADATA
            _articleURL:req.protocol + '://' + req.get('host') + req.originalUrl,
            _copyYear:new Date().getFullYear(),
            _articleImage:ARTICLEDEFAULTIMAGEURL,
        },res,{
            headerFooter:true,
            lazyloadImages:{class:'lazyload'}
        })
    })
    .catch(function(e) {

    })
})
firedocsApp.get(DOCS_URI+'/:articleId', function (req, res) {///user/:id'  req.params.id
    if(!req.params.articleId){
        res.redirect(301,DOCS_URI);
    }
    var getArticleMetadata = function() {
        return new Promise((resolve, reject) => {
            firestore.collection(COLLECTIONLIST).doc(req.params.articleId).get().then(doc => {
                var artdata = doc.data()
                if (!doc.exists||artdata.d) {//b:true si es artículo en Borarrador
                    reject('notfound')
                }else{
                    resolve(artdata);
                }
            }).catch(function(err){
                reject('notfound')
            });
        });
    }
    var getArticle = function() {
        return new Promise((resolve, reject) => {
            firestore.collection(COLLECTIONARTICLES).doc(req.params.articleId).get()//obtenemos el bodyHTML del artículo
            .then(art => {
                resolve(art.data())
            }).catch(function(err){
                reject('notfound')
            })
        })
    }
    var getSidenav=function() {
        return new Promise((resolve, reject) => {
            firestore.collection(COLLECTIONSECTIONS).doc('sections').get()//obtenemos el bodyHTML del artículo
            .then(doc => {
                var sections = doc.data().tree,output='<ul>';
                for (var i = 0; i < sections.length; i++) {
                    if(!sections[i].visible)continue//hidden sections are not showed
                    output+='<li class="sections"><div class="toggleTitle">'+sections[i].title+'</div><ul class="list"><div class="uncnt">'
                    for (var j = 0; j < sections[i].urls.length; j++) {
                        if(sections[i].visibility[j])continue
                        output+='<a href="'+DOCS_URI+'/'+sections[i].urls[j]+'"><li class="item">'+sections[i].titles[j]+'</li></a>'
                    }
                    output+='</div></ul></li>'
                }
                output+='</ul>'
                resolve(output)
            }).catch(function(err){
                reject('notfound')
            })
        })
    }
    return Promise.all([getArticleMetadata(),getArticle(),getSidenav()])
    .then(function(respuestas) {
        var lazyfn = function(str) {
            return
        }
        FireDocs.renderTemplate('article.html',{
            _articleTitle:respuestas[0].t,
            _articleDescription:respuestas[0].p,
            _articleBody:(LAZYLOADIMAGES)?FireDocs.lazyloadImages(respuestas[1].a,IMG_ATTRS):respuestas[1].a,
            _sidebarContent:respuestas[2],
            //METADATA
            _articleURL:req.protocol + '://' + req.get('host') + req.originalUrl,//current url for share
            _copyYear:new Date().getFullYear(),//for copyright
            _articleImage:respuestas[0].i||ARTICLEDEFAULTIMAGEURL//for social networks
        },res,{
            headerFooter:true
        })
    }).catch(function(error) {
        console.log(error)
        FireDocs.renderTemplate('404.html',{
            _copyYear:new Date().getFullYear()
        },res)
    })
})
firedocsApp.get('*',function (req, res) {//by default
    res.redirect(DOCS_URI);
});
exports.firedocs = functions.https.onRequest(firedocsApp);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
exports.articleUpdate = functions.firestore.document(COLLECTIONLIST+'/{articleUrl}')
  .onUpdate(event => {
    // listen the changes in articles visibility and updates the visibility of the articles in sections
    return new Promise((resolve,reject)=>{
        var newValue = event.data.data();
        var oldValue = event.data.previous.data();
        if(newValue.d!=oldValue.d){//if visibilitychanges (draft/public)
            let sectionsref = firestore.collection(COLLECTIONSECTIONS).doc('sections')
            sectionsref.get()
            .then((data)=>{
                if(!data.exists)return resolve()
                let sections = data.data().tree
                for (var i = 0; i < sections.length; i++) {
                    let pos = sections[i].urls.indexOf(event.params.articleUrl)
                    if(pos!=-1){
                        sections[i].visibility[pos]=newValue.d
                    }
                }
                sectionsref.update({tree:sections}).then(resolve).catch(reject)
            })
            .catch(reject)
        }else{
            resolve()
        }
    })
});
exports.articleDelete = functions.firestore.document(COLLECTIONLIST+'/{articleUrl}')
  .onDelete(event => {
    // listen when an article is deleted and if it there is in sections we remove it
    return new Promise((resolve,reject)=>{
        let sectionsref = firestore.collection(COLLECTIONSECTIONS).doc('sections')
        sectionsref.get()
        .then((data)=>{
            if(!data.exists)return resolve()
            let sections = data.data().tree
            for (var i = 0; i < sections.length; i++) {
                let pos = sections[i].urls.indexOf(event.params.articleUrl)
                if(pos!=-1){
                    sections[i].urls.splice(pos,1)
                    sections[i].titles.splice(pos,1)
                    sections[i].visibility.splice(pos,1)
                }
            }
            sectionsref.update({tree:sections}).then(resolve).catch(reject)
        })
        .catch(reject)
    })
});
