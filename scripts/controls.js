class Checklist {
    Controls = [];

    DomContainer;
    ControlContainer;

    constructor(){
        // create main dom object
        this.DomContainer = document.createElement("main");
        // create control container
        this.ControlContainer = document.createElement("div");
    }

    Initialize(){
        // initialize main dom object
        this.DomContainer.id = "checklist";
        this.DomContainer.classList.add("checklist");

        // create title bar
        let h1 = document.createElement("h1");
        h1.classList.add("title");
        let input = document.createElement("input");
        input.type = "text";
        input.name = "title";
        input.placeholder = "Checklist title";
        h1.appendChild(input);
        this.DomContainer.appendChild(h1);

        // initialize control container
        this.ControlContainer.id = "listcontainer";
        this.ControlContainer.classList.add("listcontainer");
        this.DomContainer.appendChild(this.ControlContainer);

        // prevent browser default drop function for drag/drop
        this.DomContainer.addEventListener("drop", (e) => {
            e.preventDefault();
        });

        // create a button to add an element
        let newButton = this.GetControlCreator("");
        newButton.id = "addbegin";
        this.ControlContainer.appendChild(newButton);
    }

    Insert(obj, addAfterObjId){

        // add to document
        let addAfterObjIndex = this.IndexOfId(addAfterObjId);
        if(addAfterObjIndex>=0){
            this.Controls[addAfterObjIndex].DomObject.insertAdjacentElement('afterend', obj.DomObject);
        }else if(this.Controls.length > 0){
            this.Controls[0].DomObject.insertAdjacentElement('beforebegin', obj.DomObject);
        }else{
            this.ControlContainer.appendChild(obj.DomObject);
        }
        // add to list of controls
        this.Controls.splice(addAfterObjIndex + 1, 0, obj);
    }
    Add(obj, addAfterObjId){
        // TODO: check name conflict

        // insert into lists & dom container
        this.Insert(obj, addAfterObjId);

        // set up "new item" button after
        obj.DomObject.appendChild(this.GetControlCreator(obj.Id));

        // set up drag (& drop)
        let grip = obj.DomObject.querySelector(".control-button.move");
        grip.addEventListener("dragstart", (e) => {
            // drag
            this.CollapseAllControlCreators();
            e.dataTransfer.setData("control_id", obj.Id);
            obj.DomObject.style.display = "none";
        });
        obj.DomObject.addEventListener("dragend", (e) => {
            // hover
            obj.DomObject.style.display = "block";
            e.preventDefault();
        });
        obj.DomObject.addEventListener("drop", (e) => {
            // drop
            e.preventDefault();
        });

        // set up delete
        let trash = obj.DomObject.querySelector(".control-button.delete");
        trash.addEventListener("click", () => {
            this.Delete(obj.Id);
            this.CollapseAllControlCreators();
        });
    }

    GetControlCreator(afterId){
        let obj = document.getElementById("model_add").cloneNode(true);
        obj.id = '';
        // make the expand/collapse work
        let link = obj.querySelector("a");
        link.addEventListener("click", () => {
            this.ExpandControlCreatorFor(afterId);
        });

        // create a button to add each type
        for(let typeKey of Object.keys(controlClasses)){
            let button = document.createElement("button");
            let icon = document.createElement("img");
            // set image source
            icon.src = "./resources/"+typeKey+".svg";
            button.appendChild(icon);
            // write text
            button.appendChild(document.createTextNode(
                controlClasses[typeKey].displayName
            ));
            // set click event
            button.addEventListener("click", () => {
                this.Add(new (controlClasses[typeKey].classRef)(), afterId);
                this.ExpandControlCreatorFor(afterId);
            });
            // add button
            obj.querySelector("div.add-menu").appendChild(button);
        }
 
        // set up (drag &) drop
        link.addEventListener("dragover", (e) => {
            // drag & hover
            e.preventDefault();
            link.classList.add("droppable");
        });
        link.addEventListener("dragenter", (e) => {
            // drag & hover
            e.preventDefault();
            link.classList.add("droppable");
        });
        link.addEventListener("dragleave", (e) => {
            // drag & hover
            e.preventDefault();
            link.classList.remove("droppable");
        });
        link.addEventListener("drop", (e) => {
            // drop
            e.preventDefault();
            link.classList.remove("droppable");
            let draggedId = e.dataTransfer.getData("control_id");
            if(!draggedId.startsWith("control_")){
                // this is NOT a control
                return;
            }
            this.Move(draggedId, afterId);
        });
    
        return obj;
    }

    CollapseAllControlCreators(){
        let nodeList = this.ControlContainer.querySelectorAll("div.create:not(#model_add)");
        for(let n=0; n<nodeList.length; n++){
            nodeList[n].classList.remove("expanded");
            nodeList[n].classList.add("collapsed");
        }
    }

    ExpandControlCreatorFor(objId){
        // decide whether to expand or collapse the selected creator bar
        let targetQuery = objId=="" ? "#addbegin" : "#"+objId+" div.create";
        let targetDiv = this.ControlContainer.querySelector(targetQuery);
        let expandTarget = !targetDiv.classList.contains("expanded");

        // loop through to collapse everything (and possibly expand target)
        let nodeList = this.ControlContainer.querySelectorAll("div.create:not(#model_add)");
        for(let n=0; n<nodeList.length; n++){
            if(nodeList[n]==targetDiv && expandTarget){
                nodeList[n].classList.remove("collapsed");
                nodeList[n].classList.add("expanded");
                continue;
            }
            nodeList[n].classList.remove("expanded");
            nodeList[n].classList.add("collapsed");
        }
    }

    Move(objId, afterId){
        let obj = this.Get(objId);
        this.Delete(objId);
        this.Insert(obj, afterId);
    }

    Delete(objId){
        let indexToDelete = this.IndexOfId(objId);
        if(indexToDelete >= 0){
            // remove from DOM
            let nodeToDelete = this.Get(objId).DomObject;
            this.ControlContainer.removeChild(nodeToDelete);
            // remove from control list
            this.Controls.splice(indexToDelete, 1);
        }
    }

    Get(objId){
        return this.Controls[this.IndexOfId(objId)];
    }

    IndexOfId(objId){
        for(let o=0; o<this.Controls.length; o++){
            if(this.Controls[o].Id == objId){
                return o;
            }
        }
        return -1;
    }
}

class Control {
    Id;
    DomObject;

    constructor(obj){
        obj.id = "";
        this.DomObject = document.getElementById("model_control").cloneNode(true);

        // set up unique id
        this.Id = "control_"+Math.floor(Math.random()*Math.pow(16,10)).toString(16);
        this.DomObject.id = this.Id;

        obj.classList.add("control-container");
        this.DomObject.appendChild(obj);
    }
}

class Heading extends Control {
    constructor(){
        let obj = document.getElementById("model_heading").cloneNode(true);;
        super(obj);
    }
}

class Checkbox extends Control {
    constructor(){
        let obj = document.getElementById("model_checkbox").cloneNode(true);
        super(obj);
    }
}

class Notepad extends Control {
    constructor(){
        let obj = document.getElementById("model_notepad").cloneNode(true);
        super(obj);
    }
}

class ShortNote extends Control {
    constructor(){
        let obj = document.getElementById("model_short_note").cloneNode(true);
        super(obj);
    }
}


// keep a list of each control for dynamic menu rendering
const controlClasses = {
    "heading": {classRef: Heading, displayName: "Heading"},
    "checkbox": {classRef: Checkbox, displayName: "Checkbox"},
    "notepad": {classRef: Notepad, displayName: "Notepad"},
    "short_note": {classRef: ShortNote, displayName: "Short Note"}
};


// create the checklist
const checklist = new Checklist();
window.addEventListener("load", () => {
    checklist.Initialize();
    document.body.appendChild(checklist.DomContainer);
});
