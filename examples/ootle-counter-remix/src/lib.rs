use tari_template_lib::prelude::*;

#[template]
mod counter {
    use super::*;
    pub struct Counter { value: u64 }
    impl Counter {
        pub fn new() -> Component<Self> {
            Component::new(Self { value: 0 })
                .with_access_rules(ComponentAccessRules::new()
                    .method("value", rule!(allow_all))
                    .default(rule!(deny_all)))
                .create()
        }
        pub fn value(&self) -> u64 { self.value }
        pub fn increment(&mut self) { self.increment_by(1); }
        /// Add a chosen amount. The component owner retains write access.
        pub fn increment_by(&mut self, amount: u64) {
            self.value = self.value.checked_add(amount).expect("counter overflow");
        }
    }
}
