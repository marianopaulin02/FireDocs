/*

(CC) BY-NC-SA Mariano Paulin @marianopaulin02

*/
var helpController = function($scope,$mdDialog,$mdToast,$interval,$mdSidenav,$element){
    var firestore,storage;
    var newArticleSectionIdx;
    var uploadInput;

    //USER DEFINED VARIABLES ///////////////////////////////////////////////////
    /*
    var config = {
      apiKey: "<YOUR_DATA>",
      authDomain: "<YOUR_DATA>",
      databaseURL: "<YOUR_DATA>",
      projectId: "<YOUR_DATA>",
      storageBucket: "<YOUR_DATA>"
    };
    const
    COLLECTIONLIST     = 'help',                //collection name in firestore
    COLLECTIONARTICLES = 'helparticles',        //collection name in firestore
    COLLECTIONSECTIONS = 'helpsections',        //collection name in firestore
    HELP_URL = 'https://'+window.location.host+'/ayuda', //e.g: https://mysite.com/helpdesk
    STORAGEBUCKET = '', //e.g: gs://my-custom-bucket (leave in blank to use default bucket)
    HELPFILEFOLDER = 'helpfiles',                //folder for files/images In storage
    VALIDIMAGESMIMES = ["image/png","image/gif","image/jpeg"],//VALID MIME TYPES FOR IMAGES FOR UPLOAD
    VALIDFILESMIMES = [],                       //VALID MIME TYPES FOR OTHER FILES FOR UPLOAD
    MAXSIZE = 5*1024*1024,                      //(5Mb) Max sizes for upload
    CACHETIME = 86400, //Browser cache for de uploaded files in seconds 7200:2 Hours, 43200:12 Hours, 86400:24 Hours, 172800:48 Hours
    HELP_STYLES = 'css/ayuda.css', //the styles to show the post
    COLLECTION_STORAGE_EXPLORER = 'helpexplorer',//collection name in firestore
    STORAGE_PAGINATION = 50;
    $scope.login = {
        facebook:false,
        google:true,
    }*/
    ///END USER DEFINED VARIABLES////////////////////////////////////////////////////////////////////////

    var addEvent = function(elements,eventName,fn,capture){
        if(elements instanceof NodeList){
            elements.forEach(function(o){o.addEventListener(eventName,fn,!!capture)})
        }else{
            if(elements)elements.addEventListener(eventName,fn,!!capture)
        }
    }
    firebase.initializeApp(config);
    $scope.selectedIndex=1;
    $scope.user={}
    $scope.changesCount=0;
    $scope.browserEnabled = ENABLE_STORAGE_EXPLORER;
    $scope.urlregex = /^[a-z0-9_-]*$/i;
    var reverseUrlRegex = /[^a-z0-9_-]/gi;
    var doubledash = /-*-/g;
    $scope.title=['','Posts','Edit post','Sections']
    var applyAsync = function() {
        $scope.$applyAsync()
    }
    var loginFailHandler = function(error) {
        console.log(error)
      if (error.code === 'auth/account-exists-with-different-credential') {
          $scope.errorLogin='You have already signed up with a different auth provider for that email.'
          alert($scope.errorLogin);
          // If you are using multiple auth providers on your app you should handle linking
          // the user's accounts here.
      } else {
          $scope.errorLogin='Ocurrió un error al iniciar. '+(error.message)?error.message:'';
      }
      $scope.lockLogin=false
      applyAsync()
    }
    var loginSuccess = function(){
        firestore.collection(COLLECTIONLIST).get()
        .then(function(snapshot){
            $scope.posts={};
            var length = 0;
            snapshot.docs.forEach(function(o){
                length++
                var tmp = o.data()
                $scope.posts[o.id]={
                    title:tmp.t,
                    draft:!!tmp.d,
                    updated:tmp.u,
                    description:tmp.p,
                    imageURL:tmp.i,
                }
            })
            $scope.postslength=length
            $scope.selectedIndex=1
            applyAsync()
        })
        .catch(function(){
            console.log(e)
            $scope.errorLogin="Error while loading the content"
            applyAsync()
        })
    }
    $scope.logInGoogle=function(){
        if (!firebase.auth().currentUser) {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function(result) {
                //logged!
                $scope.errorLogin=''
                applyAsync()
            }).catch(loginFailHandler);
        }
        $scope.errorLogin=null
    }
    $scope.logInFacebook=function(){
        if (!firebase.auth().currentUser) {
            var provider = new firebase.auth.FacebookAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function(result){
                //logged!
            }).catch(loginFailHandler);
        }
        $scope.errorLogin=null
    }
    $scope.logOut=function(){
        if(confirm('¿Está seguro de cerrar sesión?')){
            firebase.auth().signOut();
        }
    }
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          // User is signed in.
          $scope.user=user
          firestore = firebase.firestore()
          storage = (STORAGEBUCKET)?firebase.app().storage(STORAGEBUCKET):firebase.storage()
          loginSuccess()
        } else {
          // User is signed out.
          $scope.selectedIndex=0;
        }
        $scope.lockLogin=!!user
        applyAsync()

    })
    var back = function(){
        $scope.currentPost=undefined;
        $scope.sections=undefined;
        $scope.sectionsloaded=0
        $scope.selectedIndex=1
        $scope.changesCount=0;
    }
    var changes=function(){
        $scope.changesCount++
    }
    $scope.changes=function(){
        $scope.changesCount++
    }
    $scope.backFunction=function(){
        //lookup for unsaved changes
        if(!$scope.changesCount)return back()
        var confirm = $mdDialog.confirm()
        .title('Unsaved changes')
        .textContent('')
        .ariaLabel('unsaved changes')
        .ok('Return to save')
        .cancel('go back anyway');
        $mdDialog.show(confirm).then(function() {

        },back);
    }
    function confirmExit(){
        if($scope.changesCount)return "Unsaved changes!";
    }
    window.onbeforeunload=confirmExit;
    $scope.preview = function(key){
        window.open(HELP_URL+'/'+key)
    }
    $scope.createurl=function() {
        if($scope.newpost.url.$pristine&&$scope.currentPost.title&&$scope.currentPost.isnew)$scope.currentPost.url = $scope.currentPost.title.toLowerCase().replace(reverseUrlRegex,'-').replace(doubledash,'-')
    }
    $scope.editSectionName=function(sectionIdx){
        var confirm = $mdDialog.prompt()
         .title('Rename section')
         .textContent('Type the new name')
         .ariaLabel('Section name')
         .initialValue($scope.sections[sectionIdx].title)
         .ok('Rename')
         .cancel('Cancel');
       $mdDialog.show(confirm).then(function(result) {
           changes()
           $scope.sections[sectionIdx].title = result
       });
    }
    $scope.edit = function(key){
        $scope.selectedIndex = 2;
        $scope.moredetails = 0;
        $scope.lockpostsaving=1
        $scope.newpost.$setPristine()
        firestore.collection(COLLECTIONARTICLES).doc(key).get()
        .then(function(snapshot){
            if(!snapshot.exists){
                $mdDialog.show(
                  $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Error')
                    .textContent('Is not possible edit this post right now')
                    .ariaLabel('error')
                    .ok('Got it')
                );
                $scope.selectedIndex=1
            }else{
                $scope.currentPost = $scope.posts[key]
                $scope.currentPost.url = key
                $scope.lockpostsaving=0
                tinymce.activeEditor.setContent(snapshot.data().a)
            }
            applyAsync()
        })
        .catch(connectionDialog)
    }
    $scope.createPost = function(){
        $scope.selectedIndex = 2
        $scope.currentPost={isnew:true}
        $scope.moredetails = 1
        $scope.newpost.$setPristine()
        tinymce.activeEditor.setContent('')
    }
    $scope.editSections = function(){
        $scope.selectedIndex = 3
        firestore.collection(COLLECTIONSECTIONS).doc('sections').get()
        .then(function(snapshot){
            $scope.sectionsloaded=true
            if(!snapshot.exists){
                $scope.sections=[]
                applyAsync()
                return
            }
            $scope.sections=snapshot.data().tree
            applyAsync()
        })
        .catch(function(){
            $scope.sectionsserror="Error while loading the content"
        })
    }
    var connectionDialog = function(e){
        console.log(e)
        $mdDialog.show(
          $mdDialog.alert()
            .clickOutsideToClose(true)
            .title('Error')
            .textContent('An error has been ocurred. Retry later.')
            .ariaLabel('connection error')
            .ok('Ok')
        );
        $scope.lockSections=0
        $scope.lockpostsaving=0;
        editableEditor(true)
        applyAsync()
    }
    var toast = function(msg){
        $mdToast.show(
            $mdToast.simple()
            .textContent(msg)
            .hideDelay(8000)
        );
    }
    $scope.searchTerm='';
    $scope.searchTerm1='';
    $scope.filterPosts = function() {
        var str = $scope.searchTerm.toLocaleLowerCase()
        angular.forEach($scope.newArticleKeys, function(post, key) {
            $scope.newArticleKeys[key].filter = post.title&&post.title.toLocaleLowerCase().search(str)==-1
        });
    }
    $scope.calcPostsToshow = function(){
        var str = $scope.searchTerm1.toLocaleLowerCase()
        angular.forEach($scope.posts, function(post, key) {
            $scope.posts[key].filter = post.title&&post.title.toLocaleLowerCase().search(str)==-1
        });
    }
    var editableEditor = function(cond){
        tinymce.activeEditor.getBody().setAttribute('contenteditable', !!cond);
    }
    $scope.savePost = function(){
        $scope.lockpostsaving=1;
        editableEditor(false)
        toast('Saving..')
        var saveArticle = function(){
            var task,ref=firestore.collection(COLLECTIONARTICLES).doc($scope.currentPost.url)
            if($scope.currentPost.isnew){
                task = ref.set({
                    a:tinymce.activeEditor.getContent()
                })
            }else{
                task = ref.update({
                    a:tinymce.activeEditor.getContent()
                })
            }
            task.then(function(){
                toast('Saved!')
                if($scope.currentPost.isnew)$scope.postslength++
                $scope.currentPost.isnew=false
                $scope.posts[$scope.currentPost.url] = {
                    draft:!!$scope.currentPost.draft,
                    title:$scope.currentPost.title,
                    updated:new Date(),
                    description:$scope.currentPost.description,
                    imageURL:$scope.currentPost.imageURL||'',
                }
                $scope.lockpostsaving=0;
                $scope.changesCount=0;
                applyAsync()
                editableEditor(true)
            }).catch(connectionDialog)
        }
        var saveMetadata = function(){
            var task,ref=firestore.collection(COLLECTIONLIST).doc($scope.currentPost.url),
            obj={
                d:!!$scope.currentPost.draft,
                t:$scope.currentPost.title,
                u:firebase.firestore.FieldValue.serverTimestamp(),
                p:$scope.currentPost.description,
                i:$scope.currentPost.imageURL||'',
            }
            if($scope.currentPost.isnew){
                task = ref.set(obj)
            }else{
                task = ref.update(obj)
            }
            task.then(saveArticle).catch(connectionDialog)
        }
        //FOR DELETING doc Attributeuse this value
        //firebase.firestore.FieldValue.delete()
        if($scope.currentPost.isnew){
            firestore.collection(COLLECTIONLIST).doc($scope.currentPost.url).get()
            .then(function(snapshot){
                if(snapshot.exists){//url already in use
                    $mdDialog.show(
                      $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title('Error')
                        .textContent('The url is already in use, Please pick other.')
                        .ariaLabel('url in use')
                        .ok('Ok')
                    );
                    editableEditor(true)
                }else{//the url is not used yet
                    saveMetadata()
                }
            })
            .catch(connectionDialog)
        }else{//if it isn't new
            saveMetadata()
        }
    }
    $scope.deletePost = function(key){
        var confirm = $mdDialog.confirm()
          .title('Are you sure?')
          .textContent('This post will be deleted')
          .ariaLabel('confirm')
          .ok('Delete')
          .cancel('cancel');
        $mdDialog.show(confirm).then(function() {
            toast('Deleting..')
            firestore.collection(COLLECTIONLIST).doc(key).delete()
            .then(function(){
                firestore.collection(COLLECTIONARTICLES).doc(key).delete()
                .then(function(){
                    delete $scope.posts[key]
                    $scope.postslength--
                    toast('Deleted')
                    applyAsync()
                }).catch(connectionDialog)
            }).catch(connectionDialog)
        });
    }
    $scope.convert2Draft = function(key){
        var confirm = $mdDialog.confirm()
          .title('Are you sure?')
          .textContent('This post will back to draft')
          .ariaLabel('confirm')
          .ok('Back to draft')
          .cancel('cancel');
        $mdDialog.show(confirm).then(function() {
            toast('Going back to draft')
            firestore.collection(COLLECTIONLIST).doc(key).update({
                d:true
            })
            .then(function(){
                toast('Converted to draft!')
                $scope.posts[key].draft = true;
                applyAsync()
            }).catch(connectionDialog)
        });
    }
    $scope.publishDraft = function(key){
        var confirm = $mdDialog.confirm()
          .title('Are you sure?')
          .textContent('This post will be published')
          .ariaLabel('confirm')
          .ok('Publish')
          .cancel('cancel');
        $mdDialog.show(confirm).then(function() {
            toast('Publishing...')
            firestore.collection(COLLECTIONLIST).doc(key).update({
                d:false
            })
            .then(function(){
                toast('Published!')
                $scope.posts[key].draft = false;
                applyAsync()
            }).catch(connectionDialog)
        });
    }
    $scope.openMenu = function($mdOpenMenu, ev) {$mdOpenMenu(ev);};
    $scope.moveSectionUp = function(sectionIdx){
        changes()
        $scope.sections.splice(sectionIdx-1,0,$scope.sections.splice(sectionIdx,1)[0])
    }
    $scope.moveSectionDown = function(sectionIdx){
        changes()
        $scope.sections.splice(sectionIdx,0,$scope.sections.splice(sectionIdx+1,1)[0])
    }
    $scope.moveArtUp = function(artIdx,sectionIdx){
        changes()
        $scope.sections[sectionIdx].urls.splice(artIdx-1,0,$scope.sections[sectionIdx].urls.splice(artIdx,1)[0])
        $scope.sections[sectionIdx].titles.splice(artIdx-1,0,$scope.sections[sectionIdx].titles.splice(artIdx,1)[0])
        $scope.sections[sectionIdx].visibility.splice(artIdx-1,0,$scope.sections[sectionIdx].visibility.splice(artIdx,1)[0])
    }
    $scope.moveArtDown = function(artIdx,sectionIdx){
        changes()
        $scope.sections[sectionIdx].urls.splice(artIdx,0,$scope.sections[sectionIdx].urls.splice(artIdx+1,1)[0])
        $scope.sections[sectionIdx].titles.splice(artIdx,0,$scope.sections[sectionIdx].titles.splice(artIdx+1,1)[0])
        $scope.sections[sectionIdx].visibility.splice(artIdx,0,$scope.sections[sectionIdx].visibility.splice(artIdx+1,1)[0])
    }
    $scope.addArticle = function(sectionIdx){
        newArticleSectionIdx = sectionIdx
        $scope.newArticleForm.$setPristine();
        $scope.newArticleKey=undefined
        $scope.newArticleKeys={}
        for (var postkey in $scope.posts) {
            $scope.newArticleKeys[postkey]={title:$scope.posts[postkey].title}
            if($scope.sections[sectionIdx].urls.indexOf(postkey)!=-1){
                $scope.newArticleKeys[postkey].lock = true
            }
        }
        $scope.sections[sectionIdx].urls
        $mdDialog.show({
            contentElement: '#addArticleDialog',
            clickOutsideToClose:true,
            parent: angular.element(document.body)
        });
    }
    $scope.addSection = function(){
        var confirm = $mdDialog.prompt()
         .title('New section')
         .textContent('Type the new name')
         .ariaLabel('section name')
         .ok('Add')
         .cancel('Cancel');
       $mdDialog.show(confirm).then(function(result) {
           changes()
           $scope.sections.push({title:result,urls:[],titles:[],visibility:[],visible:true})
       });
    }
    $scope.closeDialog=function(){
        $mdDialog.cancel();
    }
    $scope.addArticleOk=function(){
        $scope.sections[newArticleSectionIdx].urls.push($scope.newArticleKey)
        $scope.sections[newArticleSectionIdx].titles.push($scope.posts[$scope.newArticleKey].title)
        $scope.sections[newArticleSectionIdx].visibility.push($scope.posts[$scope.newArticleKey].draft)
        $scope.closeDialog()
        changes()
    }
    $scope.saveSections = function(){
        $scope.lockSections=1
        toast('Saving..')
        firestore.collection(COLLECTIONSECTIONS).doc('sections').set({tree:$scope.sections})
        .then(function(){
            $scope.lockSections=0
            $scope.changesCount=0
            toast('Saved!')
            applyAsync()
        })
        .catch(connectionDialog)
    }
    $scope.deleteArt = function(artIdx,sectionIdx){
        changes()
        $scope.sections[sectionIdx].urls.splice(artIdx,1)
        $scope.sections[sectionIdx].titles.splice(artIdx,1)
        $scope.sections[sectionIdx].visibility.splice(artIdx,1)
    }
    $scope.deleteSection = function(sectionIdx){
        changes()
        $scope.sections.splice(sectionIdx,1)
    }

    /*FILE MANAGER*/
    var files={}
    $scope.files={}
    $scope.fileBrowser={}
    var changeInput=function(){
            if(!uploadInput.files.length)return
            for (var i = 0; i < uploadInput.files.length; i++) {
                var randomName = firestore.collection(COLLECTIONLIST).doc().id
                var name =uploadInput.files[i].name
                $scope.files[randomName]={
                    name:(name.length<20)?name:name.substr(0,10)+'...'+name.substr(-10,name.length),
                    filename:name,
                    size:(uploadInput.files[i].size/(1024*1024)).toFixed(3)+'Mb',
                    file:uploadInput.files[i],
                    type:uploadInput.files[i].type,
                    browserName:name,
                }
                //load the preview for images
                if(VALIDIMAGESMIMES.indexOf(uploadInput.files[i].type.toLowerCase())!=-1){
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        $scope.files[randomName].previewImg = e.target.result;
                        applyAsync()
                    }
                    reader.readAsDataURL(uploadInput.files[i]);
                }else if(VALIDFILESMIMES.indexOf(uploadInput.files[i].type.toLowerCase())!=-1){
                    $scope.files[randomName].previewFile = true
                }else{
                    $scope.files[randomName].previewFile = true
                    $scope.files[randomName].error = 'Invalid file type'
                }
                if(uploadInput.files[i].size > MAXSIZE){
                    $scope.files[randomName].error = 'The file is too large. ('+(MAXSIZE/1048576).toFixed(2)+'Mb Max.)'
                }
            }
            $scope.$applyAsync()
    }
    $scope.openFileManager = function(){
        $mdSidenav('filemanager').open()
    }
    $scope.selectFiles = function(){
        uploadInput.click()
    }
    //create input file
    var uploadInput=document.createElement('input')
    uploadInput.type='file'
    uploadInput.multiple=true
    uploadInput.hidden=true
    addEvent(uploadInput,'change',changeInput)
    $scope.uploadFile = function(key){
        $scope.files[key].status='uploading'
        var metadata = {
            cacheControl:'public, max-age='+CACHETIME,
            contentType:$scope.files[key].type,
            gzip: true,
            public:true
        }
        $scope.files[key].task = storage.ref(HELPFILEFOLDER+'/'+key+'_'+$scope.files[key].filename).put($scope.files[key].file,metadata);
        $scope.files[key].task.then(function(snapshot) {
            $scope.files[key].status="uploaded"
            $scope.files[key].progress=undefined
            $scope.files[key].downloadURL = snapshot.metadata.downloadURLs[0]
            delete $scope.files[key].file //free memory

            //BROWSER
            if(ENABLE_STORAGE_EXPLORER){
                firestore.collection(COLLECTION_STORAGE_EXPLORER).doc(key).set({
                    n:$scope.files[key].browserName,
                    f:snapshot.metadata.downloadURLs[0],
                    c:new Date()
                }).then(function(){
                    console.log('ok firestore')
                    $scope.fileBrowser[key]={
                        n:$scope.files[key].browserName,
                        f:snapshot.metadata.downloadURLs[0],
                        fs:($scope.files[key].filename.length<35)?$scope.files[key].filename:$scope.files[key].filename.substr(0,20)+'...'+$scope.files[key].filename.substr(-12,$scope.files[key].filename.length)
                    }
                    applyAsync()
                }).catch(function(e){
                    console.log(e)
                    applyAsync()
                })
            }else{
                applyAsync()
            }
        })
        .catch(function(err){
            console.log(err)
            $scope.files[key].status="error"
            $scope.files[key].progress=undefined
            applyAsync()
        })
        $scope.files[key].task.on('state_changed', function(snapshot){
          $scope.files[key].progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100 ).toFixed(2)+'%';
          applyAsync()
        }, function(error) {
          // Handle unsuccessful uploads
        }, function() {
          $scope.files[key].downloadURL = $scope.files[key].task.snapshot.downloadURL;
        });
    }
    $scope.archiveFile = function(key){
        delete $scope.files[key]
    }
    $scope.deleteFile = function(key){
        $scope.files[key].oldstatus=$scope.files[key].status
        $scope.files[key].status='deleting'
        storage.ref(HELPFILEFOLDER+'/'+key+'_'+$scope.files[key].filename).delete().then(function() {
            delete $scope.files[key]
            delete $scope.fileBrowser[key]
            applyAsync()
            toast('Deleted successfully')
        }).catch(function(error) {
            console.log(error)
          toast('Cannot delete')
          $scope.files[key].status=$scope.files[key].oldstatus
          applyAsync()
        });
    }
    $scope.copyUrl = function(key){
        $scope.copy(HELP_URL+'/'+key)
    }
    $scope.copy=function(str) {//copia un texto al portapapeles
        var aux = document.createElement("input");
        aux.setAttribute("value", str);
        document.body.appendChild(aux);
        aux.select();
        document.execCommand("copy");
        document.body.removeChild(aux);
        toast('Copied to clipboard');
    }
    /*FILES BROWSER*/
    $scope.browserMore=0
    var lastBrowserResult;
    var browserSearchDb=function(q){
        return q.limit(STORAGE_PAGINATION).get().then(function(snap){
            console.log(snap)
            $scope.browserMore =  snap.size == STORAGE_PAGINATION;
            var count=0;
            snap.docs.forEach(function(doc){
                var tmp = doc.data(),
                first = tmp.f.lastIndexOf('/'),
                last = tmp.f.lastIndexOf('?'),
                tmpn = tmp.f.substring(first + tmp.f.substring(first).indexOf('_') + 1,last)
                $scope.fileBrowser[doc.id] = {
                    f:tmp.f,
                    n:tmp.n,
                    fs:(tmpn.length<35)?tmpn:tmpn.substr(0,20)+'...'+tmpn.substr(-12,tmpn.length)
                }
                lastBrowserResult = tmp.c
            })
            $scope.browserNoRes=snap.docs.length==0
        }).catch(function(e){
            console.log(e)
            toast('Error, retry later')
        })
    }
    $scope.browserNextPage = function(){
        $scope.waitBrowser = 1;
        if(!lastBrowserResult)return
        var q = firestore.collection(COLLECTION_STORAGE_EXPLORER).orderBy('c','desc').startAfter(lastBrowserResult)
        browserSearchDb(q).then(function(){
            $scope.waitBrowser = 0;
            applyAsync()
        }).catch(function(){
            $scope.waitBrowser = 0;
            applyAsync()
        })
    }
    $scope.openBrowser=function(){
        if($scope.browserLoaded==1)return
        var q = firestore.collection(COLLECTION_STORAGE_EXPLORER).orderBy('c','desc')
        browserSearchDb(q).then(function(){
            $scope.browserLoaded = 1
            applyAsync()
        }).catch(function(){
            $scope.browserLoaded = 'error'
            applyAsync()
        })
    }
    $scope.browserSearchStr=''
    $scope.browserSearch = function(browserSearchStr){
        var str = browserSearchStr.toLocaleLowerCase()
        angular.forEach($scope.fileBrowser, function(file, key){
            $scope.fileBrowser[key].filter = (file.n+' '+file.t).toLocaleLowerCase().search(str)==-1
        });
        applyAsync()
    }
    $scope.deleteBrowserFile = function(key){
        https://firebasestorage.googleapis.com/v0/b/afe-documentation/o/helpfiles%2FEEqFaUBFq4wuj1CLpE0j_comprobantes-en-linea-AFIP.jpg?alt=media&token=09ef5055-3b1f-4823-979f-1c8c48ae1358
        var tmp=$scope.fileBrowser[key].f,path = storage.et.bucket+'/o/'+HELPFILEFOLDER;
        var pos = tmp.indexOf(path)
        console.log(tmp,path,storage.et.bucket)
        if(pos == -1)return toast('Cannot delete the file') //maybe the storage bucket changes in the time
        var last= tmp.lastIndexOf('?')
        console.log('delete', decodeURIComponent(tmp.substring(tmp.indexOf(path)+path.length,(last==-1)?tmp.length:last)))
        var confirm = $mdDialog.confirm()
        .title('Delete file permanently?')
        .textContent('"'+$scope.fileBrowser[key].fs+'" could be in use in some post.')
        .ariaLabel('delete')
        .ok('Delete')
        .cancel('cancel');
        $mdDialog.show(confirm).then(function() {
            toast('Deleting file..')
            storage.ref(HELPFILEFOLDER+decodeURIComponent(tmp.substring(tmp.indexOf(path)+path.length,(last==-1)?tmp.length:last))).delete()
            .then(function() {
                firestore.doc(COLLECTION_STORAGE_EXPLORER+'/'+key).delete().then(function(){
                    toast('File deleted!')
                    delete $scope.fileBrowser[key]
                    delete $scope.files[key]
                }).catch(function(){
                    toast('Error deleting file from DB')
                })
            }).catch(function(error) {
              toast('Error deleting file from storage')
            });
        },function(){});
    }
    $scope.openBrowserFile = function(key){
        window.open($scope.fileBrowser[key].f)
    }
    /*EDITOR*/
    tinymce.init({
        selector: '#mytextarea',
        height : 800,
        max_width: 500,
        plugins : 'table advlist autolink textcolor link image lists charmap print preview code',
        menubar: "edit insert view fotmat table tools",
        toolbar :'undo, redo, preview | styleselect, bold, italic , underline, forecolor, backcolor | numlist bullist alignleft aligncenter alignright | strikethrough, subscript, superscript, removeformat, formats | link image code',
        textcolor_cols: "5",
        textcolor_rows: "5",
        lists_indent_on_tab:true,
        content_css: [
            '//fonts.googleapis.com/css?family=Open+Sans',
            HELP_STYLES],
        style_formats: [
            { title: 'Título', block: 'h2'},
            { title: 'Subtítulo', block: 'h3'},
            { title: 'Código', inline: 'code', classes : 'code'},
            { title: 'Nota', block: 'blockquote', classes : 'blockquote'},
        ],
        setup:function(ed) {
            ed.on('change', function(e) {
                $scope.changes()
                applyAsync()
            });
        },
        textcolor_map: [
        "f44336", "Rojo",
        "e81e63", "Rosa",
        "9c27b0", "Púrpura",
        "673ab7", "Púrpura oscuro",
        "3f51b5", "Indigo",
        "2196f2", "Azul",
        "03a9f3", "Celeste",
        "00bcd3", "Cian",
        "009688", "Verde Azulado",
        "4caf50", "Verde",
        "8bc24a", "Verde claro",
        "ccdb39", "Lima",
        "feea3b", "Amarillo",
        "fec007", "Ambar",
        "fe9800", "Naranja",
        "fe5722", "Naranja Oscuro",
        "795548", "Marrón",
        "9e9e9e", "Gris",
        "607d8b", "Gris Azulado",
        "000000", "Negro",
        "FFFFFF", "Blanco",
      ]
    });
}
//ANGULAR THINGS
window.app = angular.module('helpdashboard', ['ngMaterial', 'ngMessages']);
var config = function($mdThemingProvider) {
}
config.$inject = []
app.config(config);
helpController.$inject = ['$scope','$mdDialog','$mdToast','$interval','$mdSidenav','$element'];
app.controller('helpdashboard',helpController)
