describe('Dropdown setValue bug', function() {
  this.timeout(10000);

  it('should fail to set dropdown value on Windows', async function(browser) {
    const url = browser.options.launch_url;
    console.log(`Navigating to ${url}`);
    await browser.url(url);

    const firstDropdownSelector = '#dropdown1';
    const secondDropdownSelector = '#dropdown2';

    // --- First Dropdown ---
    console.log('Interacting with the first dropdown.');
    await browser.click(firstDropdownSelector);
    const firstDropDownSecondValue = "SPORTS";
    await browser.setValue(firstDropdownSelector, firstDropDownSecondValue);
    await browser.pause(2000);

    let selectedValue = await browser.getAttribute(firstDropdownSelector, 'value');
    browser.assert.strictEqual(selectedValue, firstDropDownSecondValue,
        `First dropdown value should be "${firstDropDownSecondValue}"`);

    // --- Second Dropdown ---
    console.log('Interacting with the second dropdown.');
    await browser.click(secondDropdownSelector);
    const secondDropdownSecondValue = "Master of Fine Arts";
    await browser.setValue(secondDropdownSelector, secondDropdownSecondValue);
    await browser.pause(2000);

    selectedValue = await browser.getAttribute(secondDropdownSelector, 'value');
    browser.assert.strictEqual(selectedValue, secondDropdownSecondValue,
      `Second dropdown value should be "${secondDropdownSecondValue}"`);
  });
});