ScholarItemPane = new function()
{
	var _dynamicFields;
	var _creatorTypeMenu;
	var _beforeRow;
	var _notesMenu;
	var _notesField;
	var _notesLabel;
	
	var _creatorCount;
	
	var _itemBeingEdited;
	
	this.onLoad = onLoad;
	this.viewItem = viewItem;
	this.changeTypeTo = changeTypeTo;
	this.addCreatorRow = addCreatorRow;
	this.removeCreator = removeCreator;
	this.showEditor = showEditor;
	this.hideEditor = hideEditor;
	this.modifyField = modifyField;
	this.modifyCreator = modifyCreator;
	this.modifySelectedNote = modifySelectedNote;
	this.removeSelectedNote = removeSelectedNote;
	this.addNote = addNote;
	this.onNoteSelected = onNoteSelected;
	
	function onLoad()
	{
		_dynamicFields = document.getElementById('editpane-dynamic-fields');
		_itemTypeMenu = document.getElementById('editpane-type-menu');
		_creatorTypeMenu = document.getElementById('creatorTypeMenu');
		_notesMenu = document.getElementById('scholar-notes-menu');
		_notesField = document.getElementById('scholar-notes-field');
		_notesLabel = document.getElementById('scholar-notes-label');
		
		var creatorTypes = Scholar.CreatorTypes.getTypes();
		for(var i = 0; i < creatorTypes.length; i++)
		{
			var menuitem = document.createElement("menuitem");
			menuitem.setAttribute("label",Scholar.getString('creatorTypes.'+creatorTypes[i]['name']));
			menuitem.setAttribute("typeid",creatorTypes[i]['id']);
			if(creatorTypes[i]['id'] == 0)
				menuitem.setAttribute("selected",true);
			_creatorTypeMenu.appendChild(menuitem);
		}
		
		var itemTypes = Scholar.ItemTypes.getTypes();
		for(var i = 0; i<itemTypes.length; i++)
			_itemTypeMenu.appendItem(Scholar.getString("itemTypes."+itemTypes[i]['name']),itemTypes[i]['id']);
		
		return true;
	}
	
	/*
	 * Loads an item 
	 */
	function viewItem(thisItem)
	{
		if(_itemBeingEdited && thisItem.getID() == _itemBeingEdited.getID())
			return;
			
		if(document.commandDispatcher.focusedElement)
			document.commandDispatcher.focusedElement.blur();
			
		_itemBeingEdited = thisItem;
		
		reloadFields();
	}
	
	function reloadFields()
	{
		while(_dynamicFields.hasChildNodes())
			_dynamicFields.removeChild(_dynamicFields.firstChild);
		
		for(var i = 0, len = _itemTypeMenu.firstChild.childNodes.length; i < len; i++)
			if(_itemTypeMenu.firstChild.childNodes[i].value == _itemBeingEdited.getType())
				_itemTypeMenu.selectedIndex = i;
		
		var fieldNames = new Array("title","dateAdded","dateModified");
		var fields = Scholar.ItemFields.getItemTypeFields(_itemBeingEdited.getField("itemTypeID"));
		for(var i = 0; i<fields.length; i++)
			fieldNames.push(Scholar.ItemFields.getName(fields[i]));
		
		for(var i = 0; i<fieldNames.length; i++)
		{
			var editable = (!_itemBeingEdited.isPrimaryField(fieldNames[i]) || _itemBeingEdited.isEditableField(fieldNames[i]));
			
			var valueElement = createValueElement(_itemBeingEdited.getField(fieldNames[i]), editable ? fieldNames[i] : null);
			
			var label = document.createElement("label");
			label.setAttribute("value",Scholar.getString("itemFields."+fieldNames[i])+":");
			label.setAttribute("onclick","this.nextSibling.blur();");
			
			addDynamicRow(label,valueElement);
		}
		
		//CREATORS:
		_beforeRow = _dynamicFields.firstChild.nextSibling;
		_creatorCount = 0;
		if(_itemBeingEdited.numCreators() > 0)
		{
			for(var i = 0, len=_itemBeingEdited.numCreators(); i<len; i++)
			{
				var creator = _itemBeingEdited.getCreator(i);
				addCreatorRow(creator['firstName'], creator['lastName'], creator['creatorTypeID']);
			}
		}
		else
		{
			addCreatorRow('', '', 1);
		}
		
		//NOTES:
		_notesMenu.removeAllItems();
				
		var notes = _itemBeingEdited.getNotes();
		if(notes.length)
			for(var i = 0; i < notes.length; i++)
				_notesMenu.appendItem(_noteToTitle(_itemBeingEdited.getNote(notes[i])),notes[i]);
		else
			addNote();

		_updateNoteCount();
		_notesMenu.selectedIndex = 0;
		
		onNoteSelected();
	}
	
	function changeTypeTo(id)
	{
		if(id != _itemBeingEdited.getType() && confirm(Scholar.getString('pane.item.changeType')))
		{
			_itemBeingEdited.setType(id);
			_itemBeingEdited.save();
			reloadFields();
		}
	}
	
	function addDynamicRow(label, value, beforeElement)
	{		
		var row = document.createElement("row");
		row.appendChild(label);
		row.appendChild(value);
		if(beforeElement)
			_dynamicFields.insertBefore(row, _beforeRow);
		else	
			_dynamicFields.appendChild(row);		
	}
	
	function addCreatorRow(firstName, lastName, typeID)
	{
		if(!firstName)
			firstName = "(first)";
		if(!lastName)
			lastName = "(last)";
		var label = document.createElement("label");
		label.setAttribute("value",Scholar.getString('creatorTypes.'+Scholar.CreatorTypes.getTypeName(typeID))+":");
		label.setAttribute("popup","creatorTypeMenu");
		label.setAttribute("fieldname",'creator-'+_creatorCount+'-typeID');
		label.className = 'clicky';
		
		var row = document.createElement("hbox");
		
		var firstlast = document.createElement("hbox");
		firstlast.setAttribute("flex","1");
		firstlast.appendChild(createValueElement(lastName+",", 'creator-'+_creatorCount+'-lastName'));
		firstlast.appendChild(createValueElement(firstName, 'creator-'+_creatorCount+'-firstName'));
		row.appendChild(firstlast);
		
		var removeButton = document.createElement('label');
		removeButton.setAttribute("value","-");
		removeButton.setAttribute("class","clicky");
		removeButton.setAttribute("onclick","ScholarItemPane.removeCreator("+_creatorCount+")");
		row.appendChild(removeButton);
		
		var addButton = document.createElement('label');
		addButton.setAttribute("value","+");
		addButton.setAttribute("class","clicky");
		addButton.setAttribute("onclick","ScholarItemPane.addCreatorRow('','',1);");
		row.appendChild(addButton);
		
		_creatorCount++;
		
		addDynamicRow(label, row, true);
	}
	
	function createValueElement(valueText, fieldName)
	{
	 	var valueElement = document.createElement("label");
		if(fieldName)
		{
			valueElement.setAttribute('fieldname',fieldName);
			valueElement.setAttribute('onclick', 'ScholarItemPane.showEditor(this);');
			valueElement.className = 'clicky';
		}

		var firstSpace;		
		if(typeof valueText == 'string')
			firstSpace = valueText.indexOf(" ");

		if((firstSpace == -1 && valueText.length > 29 ) || firstSpace > 29)
		{
			valueElement.setAttribute('crop', 'end');
			valueElement.setAttribute('value',valueText);
		}
		else
			valueElement.appendChild(document.createTextNode(valueText));
		return valueElement;
	}
	
	function removeCreator(index)
	{
		_itemBeingEdited.removeCreator(index);
		_itemBeingEdited.save();
		reloadFields();
	}
	
	function showEditor(elem)
	{
		var fieldName = elem.getAttribute('fieldname');
		var value = '';
		var creatorFields = fieldName.split('-');
		if(creatorFields[0] == 'creator')
		{
			var c = _itemBeingEdited.getCreator(creatorFields[1]);
			if(c)
				value = c[creatorFields[2]];
		}
		else
		{
			value = _itemBeingEdited.getField(fieldName);
		}
		
		var t = document.createElement("textbox");
		t.setAttribute('value',value);
		t.setAttribute('fieldname',fieldName);
		t.setAttribute('flex','1');
		
		var box = elem.parentNode;
		box.replaceChild(t,elem);
		
		t.select();
		t.setAttribute('onblur',"ScholarItemPane.hideEditor(this, true);");
		t.setAttribute('onkeypress','if(event.keyCode == event.DOM_VK_RETURN) document.commandDispatcher.focusedElement.blur(); else if(event.keyCode == event.DOM_VK_ESCAPE) ScholarItemPane.hideEditor(document.commandDispatcher.focusedElement, false);'); //for some reason I can't just say this.blur();
	}
	
	function hideEditor(t, saveChanges)
	{
		var textbox = t.parentNode.parentNode;
		var fieldName = textbox.getAttribute('fieldname');
		var value = t.value;
		
		var elem;
		var creatorFields = fieldName.split('-');
		if(creatorFields[0] == 'creator')
		{
			if(saveChanges)
				modifyCreator(creatorFields[1],creatorFields[2],value);
			
			elem = createValueElement(_itemBeingEdited.getCreator(creatorFields[1])[creatorFields[2]], fieldName);
		}
		else
		{
			if(saveChanges)
				modifyField(fieldName,value);
		
			elem = createValueElement(_itemBeingEdited.getField(fieldName),fieldName);
		}
		
		var box = textbox.parentNode;
		box.replaceChild(elem,textbox);
		
	}
	
	function modifyField(field, value)
	{
		_itemBeingEdited.setField(field,value);
		_itemBeingEdited.save();
	}
	
	function modifyCreator(index, field, value)
	{
		var creator = _itemBeingEdited.getCreator(index);
		var firstName = creator['firstName'];
		var lastName = creator['lastName'];
		var typeID = creator['typeID'];
		
		if(field == 'firstName')
			firstName = value;
		else if(field == 'lastName')
			lastName = value;
		else if(field == 'typeID')
			typeID = value;
		
		_itemBeingEdited.setCreator(index, firstName, lastName, typeID);
		_itemBeingEdited.save();
	}
	
	function modifySelectedNote()
	{
		if(_notesMenu.selectedIndex == -1)
			return;
		
		var id = _selectedNoteID();
		if(id)
		{
			_itemBeingEdited.updateNote(id,_notesField.value);
		}
		else if(_notesField.value)//new note
		{
			id = _itemBeingEdited.addNote(_notesField.value);
			_notesMenu.selectedItem.setAttribute('value',id);
		}
		
		var label = _noteToTitle(_notesField.value);
		_notesMenu.selectedItem.label = label;		//sets the individual item label
		_notesMenu.setAttribute('label', label);	//sets the 'overall' label of the menu... not usually updated unless the item is reselected
	}
	
	function removeSelectedNote()
	{
		if(_notesField.value != "")
			if(!confirm(Scholar.getString('pane.item.notes.delete.confirm')))
				return;
		
		var id = _selectedNoteID();
		if(id)
		{
			_itemBeingEdited.removeNote(id);
		}
		
		var oldIndex = _notesMenu.selectedIndex;
		_notesMenu.removeItemAt(oldIndex);
		_notesMenu.selectedIndex = Math.max(oldIndex-1,0);
		
		if(_notesMenu.firstChild.childNodes.length == 0)
		{
			addNote();
		}
		else
		{
			onNoteSelected();
			_updateNoteCount();
		}
	}
	
	function addNote()
	{
		modifySelectedNote();
		_notesMenu.appendItem(Scholar.getString('pane.item.notes.untitled'),null);
		_notesMenu.selectedIndex = _notesMenu.firstChild.childNodes.length-1;
		
		onNoteSelected();
		_updateNoteCount();
	}
	
	function onNoteSelected()
	{
		var id = _selectedNoteID();
		
		Scholar.debug(id);
		
		if(id)
			_notesField.value = _itemBeingEdited.getNote(id);
		else
			_notesField.value = "";
	}
	
	function _noteToTitle(text)
	{
		var MAX_LENGTH = 100;
		
		var t = text.substring(0, MAX_LENGTH);
		var ln = t.indexOf("\n");
		if (ln>-1 && ln<MAX_LENGTH)
		{
			t = t.substring(0, ln);
		}
		
		if(t == "")
		{
			return Scholar.getString('pane.item.notes.untitled');
		}
		else
		{
			return t;
		}
	}
	
	function _updateNoteCount()
	{
		var c = _notesMenu.firstChild.childNodes.length;
		
		_notesLabel.value = Scholar.getString('pane.item.notes.count.'+(c != 1 ? "plural" : "singular")).replace('%1',c) + ":";
	}
	
	function _selectedNoteID()
	{
		return _notesMenu.selectedItem.getAttribute('value'); //for some reason, selectedItem.value is null sometimes.
	}
}

addEventListener("load", function(e) { ScholarItemPane.onLoad(e); }, false);
