'use strict'

let contractAddress = $('#contractAddress');
let deployedContractAddressInput = $('#deployedContractAddressInput');
let loadDeployedContractButton = $('#loadDeployedContractButton');
let deployNewContractButton = $('#deployNewContractButton');

let killContractButton = $('#killContractButton')

let whoami = $('#whoami');
let whoamiButton = $('#whoamiButton');
let copyButton = $('#copyButton');

let update = $('#update');

let logger = $('#logger');

let deposit = $('#deposit');
let depositButton = $('#depositButton');

let withdraw = $('#withdraw');
let withdrawButton = $('#withdrawButton');

let transferEtherTo = $('#transferEtherTo');
let transferEtherValue = $('#transferEtherValue');
let transferEtherButton = $('#transferEtherButton');

// TODO start
let NCCUCoinBalance = $('#NCCUCoinBalance');
let mintNCCUCoinValue = $('#mintNCCUCoinValue');
let mintNCCUCoinButton = $('#mintNCCUCoinButton');

let buyNCCUCoinValue = $('#buyNCCUCoinValue');
let buyNCCUCoinButton = $('#buyNCCUCoinButton');

let transferNCCUCoinValue = $('#transferNCCUCoinValue')
let transferNCCUCoinButton = $('#transferNCCUCoinButton')
let transferNCCUCoinTo = $('#transferNCCUCoinTo')
let checkOwnerButton = $('#checkOwnerButton')
let newOwnerAddress = $('#newOwnerAddress')
let transferOwnerButton = $('#transferOwnerButton')
let transferEtherToExt = $('#transferEtherToExt')
let transferEtherValueExt = $('#transferEtherValueExt')
let transferEtherButtonExt = $('#transferEtherButtonExt')
// TODO end

let bankAddress = "";
let nowAccount = "";

function log(...inputs) {
	for (let input of inputs) {
		if (typeof input === 'object') {
			input = JSON.stringify(input, null, 2)
		}
		logger.html(input + '\n' + logger.html())
	}
}

// 載入使用者至 select tag
$.get('/accounts', function (accounts) {
	for (let account of accounts) {
		whoami.append(`<option value="${account}">${account}</option>`)
	}
	nowAccount = whoami.val();

	update.trigger('click')

	log(accounts, '以太帳戶')
})

// 當按下載入既有合約位址時
loadDeployedContractButton.on('click', function () {
	loadBank(deployedContractAddressInput.val())
})

// 當按下部署合約時
deployNewContractButton.on('click', function () {
	newBank()
})

// 當按下登入按鍵時
whoamiButton.on('click', async function () {

	nowAccount = whoami.val();

	update.trigger('click')

})

// 當按下複製按鍵時
copyButton.on('click', function () {
	let textarea = $('<textarea />')
	textarea.val(whoami.val()).css({
		width: '0px',
		height: '0px',
		border: 'none',
		visibility: 'none'
	}).prependTo('body')

	textarea.focus().select()

	try {
		if (document.execCommand('copy')) {
			textarea.remove()
			return true
		}
	} catch (e) {
		console.log(e)
	}
	textarea.remove()
	return false
})

// 當按下更新按鍵時
// TODO: NCCU coin balance
update.on('click', function () {
	if (bankAddress != "") {
		$.get('/allBalance', {
			address: bankAddress,
			account: nowAccount
		}, function (result) {
			log({
				address: nowAccount,
				ethBalance: result.ethBalance,
				bankBalance: result.bankBalance,
				coinBalance: result.coinBalance
			})
			log('更新帳戶資料')

			$('#ethBalance').text('以太帳戶餘額 (wei): ' + result.ethBalance)
			$('#bankBalance').text('銀行ETH餘額 (wei): ' + result.bankBalance)
      $('#NCCUCoinBalance').text('NCCU COIN 餘額: ' + result.NCCUCoinBalance)
		})
	}
	else {
		$.get('/balance', {
			account: nowAccount
		}, function (result) {
			$('#ethBalance').text('以太帳戶餘額 (wei): ' + result.ethBalance)
			$('#bankBalance').text('銀行ETH餘額 (wei): ')
      $('#NCCUCoinBalance').text('NCCU COIN 餘額: ')
		})
	}
})

// 當按下刪除合約按鈕時
killContractButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus();
	// 刪除合約
	$.post('/kill', {
		address: bankAddress,
		account: nowAccount
	}, function (result) {
		if (result.transactionHash !== undefined) {
			log(bankAddress, '成功刪除合約');

			bankAddress = "";
			contractAddress.text('合約位址:' + bankAddress)
			deployedContractAddressInput.val(bankAddress)

			// 觸發更新帳戶資料
			update.trigger('click');

			// 更新介面
			doneTransactionStatus();
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus();

		}
	})
})

// 當按下存款按鍵時
depositButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus();
	// 存款
	$.post('/deposit', {
		address: bankAddress,
		account: nowAccount,
		value: parseInt(deposit.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.DepositEvent.returnValues, '存款成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})

})

// 當按下提款按鍵時
withdrawButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 提款
	$.post('/withdraw', {
		address: bankAddress,
		account: nowAccount,
		value: parseInt(withdraw.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.WithdrawEvent.returnValues, '提款成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})
})

// 當按下轉帳按鍵時
transferEtherButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	$.post('/transfer', {
		address: bankAddress,
		account: nowAccount,
		to: transferEtherTo.val(),
		value: parseInt(transferEtherValue.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.TransferEvent.returnValues, '轉帳成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})
})

// TODO start

// 按下檢查 Owner 時
checkOwnerButton.on('click', async function() {
	if (bankAddress == "") {
		return;
	}
  // 解鎖
	let unlock = await unlockAccount();
	if (!unlock) { return; }

	// 更新介面
	waitTransactionStatus();
	// 確認 Owner
	$.get('/owner', {
		address: bankAddress,
		account: nowAccount,
	}, function (result) {
			log({ contractOwner: result.owner})
			// 更新介面
			doneTransactionStatus()
      $('#contractOwner').text('Owner 帳戶: ' + result.owner)
	})

})

// 按下鑄幣按鍵時
mintNCCUCoinButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus();
	// 鑄幣
	$.post('/mintCoin', {
		address: bankAddress,
		account: nowAccount,
		value: parseInt(mintNCCUCoinValue.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.MintEvent.returnValues, '鑄幣成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})

})


// 按下買幣按鍵時
buyNCCUCoinButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus();
	// 買幣
	$.post('/buyCoin', {
		address: bankAddress,
		account: nowAccount,
		value: parseInt(buyNCCUCoinValue.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.BuyCoinEvent.returnValues, '買幣成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})

})

// 當按下轉幣按鍵時
transferNCCUCoinButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	$.post('/transferCoin', {
		address: bankAddress,
		account: nowAccount,
		to: transferNCCUCoinTo.val(),
		value: parseInt(transferNCCUCoinValue.val(), 10)
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.TransferCoinEvent.returnValues, '轉帳成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})
})

// 按下轉移所有權按鍵時
transferOwnerButton.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉移
	$.post('/transferOwner', {
		address: bankAddress,
		account: nowAccount,
		newOwner: newOwnerAddress.val(),
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.TransferOwnerEvent.returnValues, '轉移成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面
			doneTransactionStatus()
		}
	})
})

// 按下轉帳按鍵時
transferEtherButtonExt.on('click', async function () {

	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()
	// 轉帳
	$.post('/transferTo', {
		to: transferEtherToExt.val(),
		account: nowAccount,
		value: parseInt(transferEtherValueExt.val(), 10),
	}, function (result) {
    log(result)
    // 更新介面
    doneTransactionStatus()
    update.click()
	})
})


// TODO end

// 載入bank合約
function loadBank(address) {
	if (!(address === undefined || address === null || address === '')) {
		$.get('/contract', {
			address: address
		}, function (result) {
			if (result.bank != undefined) {
				bankAddress = address;

				contractAddress.text('合約位址:' + address)
				log(result.bank, '載入合約')

				update.trigger('click')
			}
			else {
				log(address, '載入失敗')
			}
		})
	}
}

// 新增bank合約
async function newBank() {

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	$.post('/deploy', {
		account: nowAccount
	}, function (result) {
		if (result.contractAddress) {
			log(result, '部署合約')

			// 更新合約介面
			bankAddress = result.contractAddress
			contractAddress.text('合約位址:' + result.contractAddress)
			deployedContractAddressInput.val(result.contractAddress)

			update.trigger('click');

			// 更新介面
			doneTransactionStatus();
		}
	})
}

function waitTransactionStatus() {
	$('#accountStatus').html('帳戶狀態 <b style="color: blue">(等待交易驗證中...)</b>')
}

function doneTransactionStatus() {
	$('#accountStatus').text('帳戶狀態')
}


async function unlockAccount() {
	let password = prompt("請輸入你的密碼", "");
	if (password == null) {
		return false;
	}
	else {
		return $.post('/unlock', {
			account: nowAccount,
			password: password
		})
			.then(function (result) {
				if (result == 'true') {
					return true;
				}
				else {
					alert("密碼錯誤")
					return false;
				}
			})
	}
}
