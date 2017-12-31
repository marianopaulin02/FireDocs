window.addEventListener('load',function(){
    (function(){
        var
        doc=document,
        closeBt=doc.querySelector('button.close'),
        menuBt=doc.querySelector('button.menu'),
        sidenav=doc.querySelector('aside.sidenav'),
        articleContentTop=doc.querySelector('.articleContentTop'),
        body=doc.querySelector('body'),
        centerElements = doc.querySelectorAll('.arrowLeft,.arrowRight,.playerloading'),
        arrowLeftBt = doc.querySelectorAll('.accessArrowLeft'),
        arrowRightBt = doc.querySelectorAll('.accessArrowRight'),
        footer = doc.querySelector('footer'),
        player = doc.querySelector('.player'),
        playimage = doc.querySelector('.playerimage'),
        imagesArray = doc.querySelectorAll('.mainarticle img'),
        playerElemNewtab = doc.querySelector('.player .newtab'),
        playerElemExit = doc.querySelector('.player .exitPlayer'),
        openedSide=0,playerIsOpen=false,playerCurrent=-1,
        articleContent = doc.querySelector('.articleContent'),
        contentIndex = [],
        titles = doc.querySelectorAll('.mainarticle h2,.mainarticle h3'),
        paginaHome = window.location.pathname=='/ayuda';
        var addEvent = function(elements,eventName,fn,capture){
            if(elements instanceof NodeList){
                for (var i = 0; i < elements.length; i++) {
                    elements[i].addEventListener(eventName,fn,!!capture)
                }
            }else{
                if(elements)elements.addEventListener(eventName,fn,!!capture)
            }
        }
        var addStyle = function(elements,props){//añade props = {heigth:20,width:32} a element: querySelector|querySelectorAll
            if(elements instanceof NodeList){
                for (var i = 0; i < elements.length; i++) {
                    for (var key in props) {
                        elements[i].style[key] = props[key]
                    }
                }
            }else{
                if(!elements)
                for (var key in props) {
                    elements.style[key] = props[key]
                }
            }
        }
        var addClassSingle = function(element,classn) {
            if(!element)return
            var list = element.className?element.className.split(' '):[]
            if(list.indexOf(classn)==-1){
                list.push(classn)
                element.className = list.join(' ')
            }
        }
        var addClass = function(elements,classn){
            if(!elements)return
            if(elements instanceof NodeList){
                for (var i = 0; i < elements.length; i++) {
                    addClassSingle(elements[i],classn)
                }
            }else{
                addClassSingle(elements,classn)
            }
        }
        var removeClassSingle = function(element,classn) {
            if(!element||!element.className)return
            var tmp = element.className.split(' ')
            var pos = tmp.indexOf(classn)
            if(pos!=-1){
                tmp.splice(pos,1)
                element.className = tmp.join(' ')
            }
        }
        var removeClass=function(elements,classn){
            if(!elements)return
            if(elements instanceof NodeList){
                for (var i = 0; i < elements.length; i++) {
                    removeClassSingle(elements[i],classn)
                }
            }else{
                removeClassSingle(elements,classn)
            }
        }
        var scrollfn = function(){
            if(!paginaHome){
                var scrollrestante = doc.documentElement.scrollHeight - window.scrollY - window.innerHeight
                if(scrollrestante <= footer.clientHeight){
                    var newHeigth = window.innerHeight - 92 + scrollrestante -footer.clientHeight + 'px'
                    sidenav.style.maxHeight = newHeigth;
                    articleContentTop.style.maxHeight = newHeigth;
                }
                var curritem = 0;
                for (var i = 0; i < titles.length; i++) {//modify selected item in index
                    if(titles[i].offsetTop-100<=window.pageYOffset)curritem = i
                    removeClass(contentIndex[i],'selected')
                }
                addClass(contentIndex[curritem],'selected')
            }
        }
        var resizeFunction= function(e){
            openedSide=0
            if(window.innerWidth>900){//pantalla grande
                if (!paginaHome) {
                    menuBt.style.display='none'
                    closeBt.style.display='none'
                    scrollfn()
                }
            }else{//pantalla pequeña
                if (!paginaHome) {
                    menuBt.style.display='inline-block'
                    closeBt.style.display='none'
                    removeClass(sidenav,'show')
                }
            }
            addStyle(centerElements,{marginTop:Math.ceil(window.innerHeight/2)+'px'})
        }
        var openSide = function(){
            if(openedSide){//estaba abierta
                menuBt.style.display='inline-block'
                closeBt.style.display='none'
                removeClass(body,'hide')
                removeClass(sidenav,'show')
            }else{//estaba cerrada
                menuBt.style.display='none'
                closeBt.style.display='inline-block'
                addClass(body,'hide')
                addClass(sidenav,'show')
                //ajustar los tamaños
                var nodes = doc.querySelectorAll('.sections .list')
                for (var i = 0; i < nodes.length; i++) {
                    nodes[i].style.height =  nodes[i].childNodes[0].clientHeight+'px'
                }
            }
            openedSide=!openedSide
        }
        var toggleTitle = function(e) {
            if(e.target.nextElementSibling.show){
                e.target.nextElementSibling.style.height = 0+'px'
                removeClass(e.target.parentNode.childNodes[0],'open')
            }else{
                e.target.nextElementSibling.style.height = e.target.nextElementSibling.childNodes[0].clientHeight+'px'
                addClass(e.target.parentNode.childNodes[0],'open')
            }
            e.target.nextElementSibling.show=!e.target.nextElementSibling.show
        }
        resizeFunction()
        var hotkeys=function(e) {
            switch (e.keyCode) {
                case 37://arrowLeft
                    playerPrev()
                break;
                case 39://arrowRight
                    playerNext()
                break;
                case 27://escape
                    playerClose()
                break;
            }
        }
        addEvent(window,'resize',resizeFunction)
        addEvent(window,'scroll',scrollfn)
        addEvent(window,'keydown',hotkeys)
        if(paginaHome){//solo para la pagina de home
            menuBt.style.display='none'
            closeBt.style.display='none'
        }else{//si no es la pagina de home es de un artículo
            addEvent(menuBt,'click',openSide)
            addEvent(closeBt,'click',openSide)
            addEvent(doc.querySelectorAll('aside.sidenav .sections'),'click',toggleTitle)
            var items = doc.querySelectorAll('.sections ul div a')
            for (var i = 0; i < items.length; i++) {
                if(items[i].href==window.location.href.replace(window.location.hash,'')){
                    addClass(items[i].children[0],'selected')//li
                    items[i].parentNode.parentNode.style.height = items[i].parentNode.clientHeight+'px'
                    addClass(items[i].parentNode.parentNode.childNodes[0],'open')//section header
                    items[i].parentNode.parentNode.show=1;//div
                    //SET NEXT AND PREVIOUS NAVIGATION ARTICLES
                    if(i < items.length-1){//have next
                        var el = doc.querySelector('.navcontent.next')
                        el.style.display='block'
                        var link = el.querySelector('a')
                        link.href=items[i+1].href
                        link.innerText=items[i+1].text
                    }
                    if(i){
                        var el = doc.querySelector('.navcontent.prev')
                        el.style.display='block'
                        var link = el.querySelector('a')
                        link.href=items[i-1].href
                        link.innerText=items[i-1].text
                    }
                }
            }
        }
        //PLAYER
        var playerDisplayButtons = function(pos) {
            if(pos!=-1){
                if(pos>0){
                    addStyle(arrowLeftBt,{display:'block'})
                }else{
                    addStyle(arrowLeftBt,{display:'none'})
                }
                if(pos<imagesArray.length-1){
                    addStyle(arrowRightBt,{display:'block'})
                }else{
                    addStyle(arrowRightBt,{display:'none'})
                }
            }
        }
        var playerSetImage= function(imgtag) {
            var url = imgtag.src||imgtag.attributes['data-src'].value
            playimage.style.backgroundImage=`url(${url})`;
        }
        var playerOpen = function(e){
            if(playerIsOpen)return
            playerCurrent = -1
            for (var i = 0; i < imagesArray.length; i++) {
                if(imagesArray[i]==e.target){
                    playerCurrent=i;
                    break;
                }
            }
            playerDisplayButtons(playerCurrent)
            playerSetImage(imagesArray[playerCurrent]);
            addClass(player,'openPlayer')
            playerIsOpen=true
        }
        var playerClose = function() {
            if(!playerIsOpen)return
            removeClass(player,'openPlayer')
            playerIsOpen=false
        }
        var playerNext = function() {
            if(!playerIsOpen || !imagesArray[playerCurrent+1])return
            playerDisplayButtons(++playerCurrent)
            playerSetImage(imagesArray[playerCurrent]);
        }
        var playerPrev = function() {
            if(!playerIsOpen || !imagesArray[playerCurrent-1])return
            playerDisplayButtons(--playerCurrent)
            playerSetImage(imagesArray[playerCurrent]);
        };
        addEvent(arrowRightBt,'click',playerNext)
        addEvent(arrowLeftBt,'click',playerPrev)
        addEvent(playerElemNewtab,'click',function(){
            var temp = imagesArray[playerCurrent]
            window.open(temp.src||temp.attributes['data-src'].value)
        })
        addEvent(playerElemExit,'click',playerClose)
        addEvent(playimage,'click',playerClose)
        for (var i = 0; i < imagesArray.length; i++) {
            addEvent(imagesArray[i],'click',playerOpen)
            imagesArray[i].removeAttribute('height')//make the images responsive
        }
        for (var i = 0; i < titles.length; i++) {
            var href = titles[i].innerText.replace(/ /g,'-').toLowerCase()
            var a = doc.createElement('a')//content list
            a.href = '#'+href
            a.text = titles[i].innerText
            var b = doc.createElement('a')//anchor
            b.name = href
            b.className='hidden'//make de anchor invisible
            if(titles[i].nodeName == 'H2'){

            }else if(titles[i].nodeName == 'H3'){
                a.className='sub1'
            }
            titles[i].parentNode.insertBefore(b,titles[i])//inserts an anchor <a name=""> before an H2 or H3
            articleContent.appendChild(a)
            contentIndex.push(a)
        }
        /*FAQ*/
        var openFaq = function(e){
            var span = e.target.childNodes[1]
            if(!span)return
            var p = e.target.nextElementSibling
            if(!span.isOpen){//cuando está cerrado, lo abrimos
                addClass(span,'arrowUp')
                removeClass(span,'arrowDown')
                addClass(p,'open')
            }else{//lo ceramos
                addClass(span,'arrowDown')
                removeClass(span,'arrowUp')
                removeClass(p,'open')
            }
            span.isOpen=!span.isOpen
        }
        var tmp = doc.querySelectorAll('.faqcnt h3')
        for (var i = 0; i < tmp.length; i++) {
            addEvent(tmp[i],'click',openFaq,1)
        }
        //end FAQ

        var autoheigth = doc.querySelector('.contentMain')
        if(autoheigth)autoheigth.style.minHeight = (window.innerHeight - doc.querySelector('nav').clientHeight) + 'px';

        //LAZYLOAD FOR IMAGES -> https://github.com/verlok/lazyload
        (function(w, d){
        	var b = d.getElementsByTagName('body')[0];
        	var s = d.createElement("script"); s.async = true;
        	var v = !("IntersectionObserver" in w) ? "8.5.2" : "10.3.5";
        	s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/" + v + "/lazyload.min.js";
        	w.lazyLoadOptions = {}; // Your options here. See "recipes" for more information about async.
        	b.appendChild(s);
        }(window, doc));
        //END LAZYLOAD FOR IMAGES
    })()
}, false )
