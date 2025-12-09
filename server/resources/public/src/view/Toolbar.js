

class Toolbar{
    constructor(callbackGetDropFromTeamcenter, finishEditing, setEditModeTable, checkRes) {
        this.toolbar = document.getElementById('toolbar');
        this.tcNameBox = document.getElementById('tc-name-box-id');// TODO: переименовать
        this.exitBtn = document.getElementById('exit-btn');
        this.editBtn = document.getElementById('edit-btn');
        this.previewBtn = document.getElementById('preview-btn');

        this.exitBtn.addEventListener('click', () => {
            const userConfirmed = confirm("Вы действительно хотите отметить изменения?");
            if (userConfirmed) {
                this.editMode = false;
                finishEditing(false);
                setEditModeTable(this.editMode);
                this.setEditMode(this.editMode);
            }else{
                // finishEditing(false);
            }
            this.setPreviewButton(false);
            // initTableWithCurentObject();
        })

        this.editBtn.addEventListener('click', () => {
            if (this.editBtn.classList.contains("edit")) {
                // === ПЕРВОЕ НАЖАТИЕ ===
                this.editMode = true;
        
                let buttons = document.querySelectorAll('.action-button-td, .action-button');
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].classList.remove("hidden");
                }
        
                // переключаем кнопку в режим "Сохранить"
                setEditModeTable(this.editMode);
                this.setEditMode(this.editMode);
        
            } else if (this.editBtn.classList.contains("save")) {
                // === ВТОРОЕ НАЖАТИЕ ===
                let checkStr = checkRes();
                if (checkStr) {
                    alert(checkStr);
                    return;
                }
        
                const userConfirmed = confirm("Сохранить результат?");
                if (userConfirmed) {
                    this.editMode = false;
                    finishEditing(true);  // <-- тут вызов сохранения
                    setEditModeTable(this.editMode);
                    this.setEditMode(this.editMode);
                } else {
                    console.log("сохранение отменено");
                }
            }
        
            this.setPreviewButton(false);
        });



        this.previewBtn.addEventListener('click', () => {
            
            let buttons = document.querySelectorAll('.action-button-td, .action-button');
            if (this.previewBtn.classList.contains("preview")){
            
                for(let i =0; i < buttons.length; i++){
                    buttons[i].classList.remove("hidden"); // показываю
                }
                this.setPreviewButton(false);
                // TODO убираем предп
                // TODO: меняем картинку
            }else{
                for(let i =0; i < buttons.length; i++){
                    buttons[i].classList.add("hidden"); // прячу
                }
                this.setPreviewButton(true);
            }
        });

        this.initializeDropZone();

        this.awbNameBox = document.getElementById('awb-name-box-id');
        this.callbackGetDropFromTeamcenter = callbackGetDropFromTeamcenter
    }

    // initTC(nameCompTable, uidCompTable, complTableDesc){
    //     this.tcNameBox.innerHTML = nameCompTable;
    //     this.tcNameBox.title = nameCompTable;
    //     if (complTableDesc.length)
    //         this.tcNameBox.title += " - " + complTableDesc;
    //     this.tcNameBox.setAttribute("uidCompTable", uidCompTable);
    //     this.tcNameBox.classList.remove('notexist');
    // }

    // initAWB(nameAWB, awbDesignation){
    //     this.awbNameBox.innerHTML = nameAWB;
    //     this.awbNameBox.title = nameAWB;
    //     if (awbDesignation.length)
    //         this.awbNameBox.title += " - " + awbDesignation;
    //     // this.awbNameBox.setAttribute("uidCompTable", uidAWB);
    //     this.awbNameBox.classList.remove('notexist');
    // }

    addCompTable(jsonTC){
        // TODO: пересылать инфу о TC, с Teamcenter. Записывать в trakedObject
    }

    getSelectedElementFromCompTable(){
        // TODO: получаем выбранный элемент
    }

    handleDrop(event) {
        // event.preventDefault();
        // const dropTarget = event.target;
        
        // const containerElement = dropTarget;
    
        // if (containerElement) {
        //     let droppedObjects = this.callbackGetDropFromTeamcenter();
        //     droppedObjects.forEach(droppedObject => {
        //         if (droppedObject.type === "IRM8_ComplTableRevision"){
        //             // const objectField = this.createFieldAddedObject(droppedObject.uid, droppedObject.displayName);
        //             // containerElement.appendChild(objectField)
        //             this.handleInput({ type: 'add', uid: droppedObject.uid, name: droppedObject.displayName})
        //         }
        //     });
        // }
    }

    handleInput(action) {
        // if (action.type === 'add'){
        //     this.tcNameBox.innerHTML = "<font style='color='green''>" + action.name + "</font>";
        //     this.tcNameBox.classList.remove("notexist");
        //     this.tcNameBox.setAttribute("uidCompTable", action.uid);

        //     // this.trackedObject.addDoc(this.tocLine.getAttribute('moc-uid'), action.uid, this.relation_type);
        // }
    }

    initializeDropZone() {
        // this.tcNameBox.addEventListener('dragenter', this.handleDragEnter.bind(this));
        // this.tcNameBox.addEventListener('dragover', this.handleDragOver.bind(this));
        // this.tcNameBox.addEventListener('drop', this.handleDrop.bind(this));
        // this.tcNameBox.classList.add('editable');
    }

    handleDragEnter(event) {
        // event.preventDefault();
    }

    handleDragOver(event) {
        // event.preventDefault();
    }

    setEditMode(editMode){
        this.editMode = editMode;

        if (editMode){
            this.editBtn.classList.remove('edit');
            this.editBtn.classList.add('save');
            this.editBtn.textContent = 'Сохранить';

            this.previewBtn.disabled = false;
            this.setPreviewButton(false);

        }else{
            this.editBtn.classList.remove('save');
            this.editBtn.classList.add('edit');
            this.editBtn.textContent = 'Редактировать';

            this.previewBtn.disabled = true;
            this.setPreviewButton(true); // TODO: удалить их скорее всего лишние вызовы
        }
    }

    setPreviewButton(flag){
        const previewIcon = document.getElementById("preview-icon");// TODO: прееделать на getChild
        const hiddenIcon = document.getElementById("hidden-icon");// TODO: прееделать на getChild
        if (flag){
            this.previewBtn.classList.add("preview");
            hiddenIcon.style.display = 'block';
            previewIcon.style.display = 'none';
            // TODO: icon
        }else{
            this.previewBtn.classList.remove("preview");
            previewIcon.style.display = 'block';
            hiddenIcon.style.display = 'none';
            // TODO: icon
        }
    }
}