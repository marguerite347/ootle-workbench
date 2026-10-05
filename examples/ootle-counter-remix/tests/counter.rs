use tari_template_test_tooling::{TemplateTest, transaction::args};
use tari_template_lib::prelude::*;
#[test]
fn public_read_and_denied_write() {
    let mut test = TemplateTest::my_crate();
    let c: ComponentAddress = test.call_function("Counter", "new", args![], vec![]);
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 0);
    let _: () = test.call_method(c, "increment", args![], vec![]);
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 1);
    let (_, _, attacker) = test.create_empty_account();
    let tx = test.transaction().call_method(c, "increment", args![]).build_and_seal(&attacker);
    let reason = test.execute_expect_failure(tx, vec![]);
    assert!(format!("{reason:?}").to_lowercase().contains("access"));
    let public_read = test.transaction().call_method(c, "value", args![]).build_and_seal(&attacker);
    test.execute_expect_success(public_read, vec![]);
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 1);
}

#[test]
fn later_failure_rolls_back_earlier_mutation() {
    let mut test = TemplateTest::my_crate();
    let c: ComponentAddress = test.call_function("Counter", "new", args![], vec![]);
    let tx = test.transaction()
        .call_method(c, "increment", args![])
        .call_method(c, "missing_method", args![])
        .build_and_seal(test.secret_key());
    test.execute_expect_failure(tx, vec![]);
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 0);
}

#[test]
fn remixed_increment_by_preserves_owner_access_and_rejects_overflow() {
    let mut test = TemplateTest::my_crate();
    let c: ComponentAddress = test.call_function("Counter", "new", args![], vec![]);
    let _: () = test.call_method(c, "increment_by", args![7u64], vec![]);
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 7);
    let (_, _, attacker) = test.create_empty_account();
    let denied = test.transaction().call_method(c, "increment_by", args![2u64]).build_and_seal(&attacker);
    let reason = test.execute_expect_failure(denied, vec![]);
    assert!(format!("{reason:?}").to_lowercase().contains("access"));
    let overflow = test.transaction().call_method(c, "increment_by", args![u64::MAX]).build_and_seal(test.secret_key());
    let reason = test.execute_expect_failure(overflow, vec![]);
    assert!(format!("{reason:?}").contains("counter overflow"));
    let value: u64 = test.call_method(c, "value", args![], vec![]);
    assert_eq!(value, 7);
}
