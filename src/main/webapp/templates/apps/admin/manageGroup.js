function initManageGroup() {
	initCRUDGroup();
    addOrderGroup();
//    addOrderProgramList();
//    addOrderPermissionList();
    initGroupModal();
//    initPermissionCheckboxes();
    initRegoMode();
	initCRUDRole();
    initCopyMembers();
//    initOptInGroups();
    initPanelHeader();
}

function initPanelHeader() {
    $(document.body).on('click', '.panel-tools, .btn-group .dropdown-menu', function (e) {
        e.stopPropagation();
    });
}

function initCRUDGroup() {
	var body = $(document.body);

	$('.btn-add-group').on('click', function (e) {
		e.preventDefault();
		flog('addGroupButton: click');
		showGroupModal('Group', 'Add new group', 'Add');
	});

	// Bind event for Delete forum
	body.on('click', '.btn-delete-group', function(e) {
		e.preventDefault();

		var btn = $(this);
		var name = btn.closest('.btn-group').prev().text();
		var href = $.URLEncode(name);

		flog('delete', href);
		confirmDelete(href, name, function() {
			flog('remove ', this);

			btn.parents('div.group').remove();
		});
	});

	body.on('click', '.btn-rename-group', function(e) {
		e.preventDefault();

		var btn = $(this);
		var selectGroup = btn.parents('div.group');

		showGroupModal('Group', 'Rename group', 'Rename', {
			name: btn.closest('.btn-group').prev().text(),
			group: selectGroup.attr('data-group')
		});
	});
}

var currentGroupDiv;

function initCRUDRole() {
	var body = $(document.body);
	var modal = $('#modal-edit-roles');

	body.on('click', '.btn-add-role-group', function (e) {
		e.preventDefault();

		currentGroupDiv = $(this).parents('.group');
	});

	body.on('click', '.btn-remove-role', function(e) {
		flog('click', this);
		e.preventDefault();

		if (confirm('Are you sure you want to remove this role?')) {
			var btn = $(this);
			flog('do it', btn);
			var href = btn.attr('href');
			deleteFile(href, function() {
				btn.closest('span.role').remove();
			});
		}
	});

	modal.on('click', 'input:radio', function(e) {
		var input = $(this);
		var appliesTo = input.closest('.applies-to');
		appliesTo.find('select').addClass('hide');
		appliesTo.find('input[type=radio]:checked').next().next().removeClass('hide');
	});

	modal.on('click', '.btn-add-role', function(e) {
		e.preventDefault();

		var btn = $(this);
		var article = btn.closest('article');
		var appliesTo = $('div.applies-to');
		var appliesToType = appliesTo.find('input:checked');

		if (!appliesToType[0]) {
			Msg.error('Please select what the role applies to');
			return;
		}

		var appliesToTypeVal = appliesToType.val();
		var select = appliesToType.next().next();
		var appliesToVal = ''; // if need to select a target then this has its value
		if (select[0]) {
			appliesToVal = select.val();
			if (appliesToVal.length == 0) {
				Msg.error('Please select a target for the role');
				return;
			}
			appliesToText = select.find('option:checked').text();
		} else {
			appliesToText = 'their own organisation';
		}

		flog('add role', appliesToTypeVal, appliesToVal);
		flog('currentGroupDiv', currentGroupDiv);

		var groupHref = currentGroupDiv.find('span.group-name').text();
		var roleName = btn.closest('.article-action').prev().text();

		addRoleToGroup(groupHref, roleName, appliesToTypeVal, appliesToVal, function(resp) {
			if (appliesToVal.length == 0) {
				appliesToVal = 'their own organisation';
			}

			currentGroupDiv.find('.roles-wrapper').append(
				'<span class="block role">' +
					'<span>' + roleName + ', on ' + appliesToText + '</span> ' +
					'<a class="btn btn-xs btn-danger btn-remove-role" href="' + resp.nextHref + '" title="Remove this role"><i class="fa fa-times"></i></a>' +
				'</span>'
			);
		});
	});
}


function addRoleToGroup(groupHref, roleName, appliesToType, appliesTo, callback) {
    flog('addRoleToGroup', groupHref, roleName, appliesToType, appliesTo);

    try {
        $.ajax({
            type: "POST",
            url: groupHref,
            dataType: 'json',
            data: {
                appliesToType: appliesToType,
                role: roleName,
                appliesTo: appliesTo
            },
            success: function(data) {
                flog('success', data);
                if (data.status) {
                    flog('saved ok', data);
                    callback(data);
                    Msg.success('Added role');
                } else {
                    var msg = data.messages + '\n';
                    if (data.fieldMessages) {
                        $.each(data.fieldMessages, function(i, n) {
                            msg += '\n' + n.message;
                        });
                    }
                    flog('error msg', msg);
                    Msg.error('Couldnt save the new role: ' + msg);
                }
            },
            error: function(resp) {
                flog('error', resp);
                Msg.error('Error, couldnt add role');
            }
        });
    } catch (e) {
        flog('exception in createJob', e);
    }
}

function initPermissionCheckboxes() {
    $('body').on('click', '.roles input[type=checkbox]', function(e) {
        var $chk = $(this);
        flog('checkbox click', $chk, $chk.is(':checked'));
        var isRecip = $chk.is(':checked');
        var groupName = $chk.closest('aside').attr('rel');
        var permissionList = $chk.closest('.ContentGroup').find('.PermissionList');
        setGroupRole(groupName, $chk.attr('name'), isRecip, permissionList);
    });
}

function setGroupRole(groupName, roleName, isRecip, permissionList) {
    flog('setGroupRole', groupName, roleName, isRecip);
    try {
        $.ajax({
            type: "POST",
            url: window.location.href,
            data: {
                group: groupName,
                role: roleName,
                isRecip: isRecip
            },
            success: function(data) {
                flog('saved ok', data);
                if (isRecip) {
                    permissionList.append('<li>' + roleName + '</li>');
                } else {
                    flog('remove', permissionList.find('li:contains("' + roleName + '")'));
                    permissionList.find('li:contains("' + roleName + '")').remove();
                }
            },
            error: function(resp) {
                flog('error', resp);
                Msg.error('err');
            }
        });
    } catch (e) {
        flog('exception in createJob', e);
    }
}



function addOrderGroup() {
    $('div.group').each(function(i) {
        $(this).attr('data-group', i);
    });
}

function addOrderProgramList() {
    var tempControl = $('#modalListController').html();
    $('#modalGroup tr[rel=Program] ul.ListItem li').each(function(i) {
        $(this)
                .attr('data-program', i)
                .append(tempControl)
                .find('label', 'input')
                .each(function() {
            var _this = $(this);
            var _randomId = Math.round(Math.random() * 100000);
            var _for = _this.attr('for') || null;
            var _name = _this.attr('name') || null;
            var _id = _this.attr('id') || null;

            if (_for) {
                _this.attr('for', _for + _randomId);
            }

            if (_name) {
                _this.attr('name', _name + _randomId);
            }

            if (_id) {
                _this.attr('id', _id + _randomId);
            }
        });
    });
}

function addOrderPermissionList() {
    var tempControl = $('#modalListController').html();
    $('#modalGroup tr[rel=Permission] ul.ListItem li').each(function(i) {
        $(this).attr('data-permission', i).append(tempControl);
    });
}

function resetModalControl() {
    var modal = $('#modal-group');

	modal.find('input[type=text]').val('');
	modal.attr('data-group', '');
}

function showGroupModal(name, title, type, data) {
    resetModalControl();

	var modal = $('#modal-group');
    flog('showGroupModal', modal);

    modal.find('.modal-title').html(title);
	modal.find('.btn-save-group').text(type);

    if (data) {
        if (data.name) {
            modal.find('input[name=name]').val(data.name);
        }

        if (data.group) {
            modal.attr('data-group', data.group);
        }
    }

	modal.modal('show');
}

function maxOrderGroup() {
    var _order = [];
    $('div.Group').each(function() {
        _order.push($(this).attr('data-group'));
    });

    _order.sort().reverse();

    return (parseInt(_order[0]) + 1);
}

function initGroupModal() {
	var modal = $('#modal-group');

    // Event for Add/Edit button
    modal.find('form').submit(function(e) {
	    e.preventDefault();
        
        var btn = modal.find(".btn-save-group");        
        var type = btn.html();
        flog('Click add/edit group', btn, type);

	    var name = modal.find('input[name=name]').val();
	    if (checkSimpleChars(modal.find('form'))) {
		    if (type === 'Add') {
			    createFolder(name, null, function(name, resp) {
                    Msg.success(name + ' is created!');
				    $('#group-wrapper').reloadFragment();
			    });

		    } else { // If is editing Group
			    var groupDiv = $('div.group').filter('[data-group=' + modal.attr('data-group') + ']');
			    var groupNameSpan = groupDiv.find('span.group-name');
			    var src = groupNameSpan.text();
			    src = $.URLEncode(src);
			    var dest = name;
			    dest = window.location.pathname + dest;
			    move(src, dest, function() {
				    groupNameSpan.text(name);
			    });
		    }

		    modal.modal('hide');
		    resetModalControl();
	    }
    });
}

/**
 * Called from the manageGroupRegoMode.html template
 * 
 * @returns {undefined}
 */
function initRegoMode() {
	flog('initRegoMode');
	
    initOptInGroups();
    $('form.general').forms({
        callback: function(resp) {
            flog('done', resp);
            $('#group-wrapper').reloadFragment();
            Msg.info("Saved");
        }
    });
}

function setRegoMode(currentRegoModeLink, selectedRegoModeLink) {
    var val = selectedRegoModeLink.attr('rel');
    var text = selectedRegoModeLink.text();
    var data = 'milton:regoMode=' + val;
    var href = currentRegoModeLink.closest('div.Group').find('header div > span').text();
    href = $.URLEncode(href) + '/';
    flog('setRegoMode: val=', val, 'text=', text, 'data=', data, 'href=', href);
    proppatch(href, data, function() {
        currentRegoModeLink.text(text);
    });
}

function initCopyMembers() {
	var body = $(document.body);
	var modal = $('#modal-copy-members');

	body.on('click', '.btn-copy-member', function(e) {
        flog('click', this);
        e.preventDefault();

        var btn = $(this);
        var href = btn.closest('div.group').find('span.group-name').text();
        modal.find('span.group-name').text(href);
        href = $.URLEncode(href) + '/';
        modal.find('form').attr('action', href);
		modal.modal('show');
    });

	modal.find('form').forms({
        callback: function(resp) {
            flog('done', resp);
            modal.modal('hide');
            Msg.success('Copied members');
            $('#group-wrapper').reloadFragment();
        }
    });
}

function initOptInGroups() {
    $('.optins input[type=checkbox]').click(function(e) {
        updateOptIn($(e.target));
    }).each(function(i, n) {
        updateOptIn($(n));
    });
}

function updateOptIn(chk) {
    if (chk.is(':checked')) {
        chk.closest('div.clearfix').addClass('checked');
    } else {
        chk.closest('div.clearfix').removeClass('checked');
    }

}