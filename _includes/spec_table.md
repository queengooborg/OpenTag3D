<!-- prettier-ignore-start -->

{%- assign spec = site.data.spec -%}
{%- assign map = spec[include.set] -%}

**Address Range:** `{{ map.address_range.start }}` → `{{ map.address_range.end }}`

| Name | Type | Unit | Start | Length | Usage | Examples | Description |
| :--- | :--- | :--- | :---- | :----- | :---- | :------- | :---------- |
{% for field in map.fields %} | {{ field.name | replace: "|", "\|" }}{% if field.required %}<span class="text--danger">*</span>{%endif%} | `{{ field.type }}` | {{ field.unit | replace: "|", "\|" }} {% if field.scaling %} ÷ {{ field.scaling | replace: "|", "\|" }} {% endif %} | `{{ field.start }}` | {{ field.length }} | {{ field.usage | replace: "|", "\|" }} | {% if field.examples %}`{{ field.examples | join: "`, `" | replace: "|", "\|" }}`{% endif %} | {{ field.description | replace: "|", "\|" }} |
{% endfor %}

<!-- prettier-ignore-end -->
